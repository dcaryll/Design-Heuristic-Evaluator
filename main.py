from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import base64
from PIL import Image
import io
from typing import List, Optional
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from playwright.async_api import async_playwright
import asyncio
import re
import json

load_dotenv()

app = FastAPI(title="Design Evaluator API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "https://design-heuristics.netlify.app",  # Original Netlify site
        "https://design-heuristics-check.netlify.app",  # New GitHub-connected Netlify site
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class DesignAnalysisRequest(BaseModel):
    image_data: str
    analysis_type: str = "heuristic"  # "heuristic" or "comparison"
    comparison_image: Optional[str] = None

class URLAnalysisRequest(BaseModel):
    url: str
    analysis_type: str = "heuristic"  # "heuristic" or "comparison"
    comparison_url: Optional[str] = None

class DesignAnalysisResponse(BaseModel):
    overall_score: float
    heuristic_scores: dict
    heuristic_reasoning: dict
    recommendations: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]
    summary: str

class DesignBreakdown(BaseModel):
    overall_score: float
    heuristic_scores: dict
    heuristic_reasoning: dict
    recommendations: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]
    summary: str

class ComparisonResponse(BaseModel):
    winner: str
    reasoning: str
    design_a_score: float
    design_b_score: float
    recommendations: List[str]
    design_a_analysis: DesignBreakdown
    design_b_analysis: DesignBreakdown

async def capture_screenshot(url: str) -> str:
    """
    Capture a screenshot of the given URL and return it as base64 string
    """
    try:
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        print(f"DEBUG: Attempting to capture screenshot for: {url}")
        
        async with async_playwright() as p:
            # Try Firefox first, then fallback to Chromium
            try:
                # Try Firefox browser
                browser = await p.firefox.launch(headless=True)
                print("DEBUG: Using Firefox browser")
            except Exception as firefox_error:
                print(f"DEBUG: Firefox failed ({firefox_error}), trying Chromium with different args...")
                # Fallback to Chromium with more permissive settings
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-first-run',
                        '--disable-extensions',
                        '--disable-default-apps',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--ignore-certificate-errors',
                        '--allow-running-insecure-content'
                    ]
                )
            
            try:
                page = await browser.new_page()
                
                # Set user agent to avoid bot detection
                await page.set_extra_http_headers({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                })
                
                # Set viewport size for consistent screenshots
                await page.set_viewport_size({"width": 1200, "height": 800})
                
                print(f"DEBUG: Navigating to URL...")
                # Navigate to URL with shorter timeout and domcontentloaded
                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                
                print(f"DEBUG: Waiting for page to stabilize...")
                # Wait a bit for dynamic content to load
                await page.wait_for_timeout(3000)
                
                print(f"DEBUG: Taking screenshot...")
                # Take screenshot (not full page to avoid issues)
                screenshot_bytes = await page.screenshot(type='png')
                
                print(f"DEBUG: Screenshot captured successfully, size: {len(screenshot_bytes)} bytes")
                
                # Convert to base64
                screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
                return screenshot_base64
                
            finally:
                # Ensure browser is always closed
                await browser.close()
            
    except Exception as e:
        error_msg = f"Failed to capture screenshot: {type(e).__name__}: {str(e)}"
        print(f"ERROR: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)

def extract_json_from_response(text: str) -> dict:
    """Extract JSON from AI response, handling markdown code blocks and extra text"""
    # Remove markdown code blocks if present
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        json_text = json_match.group(1)
    else:
        # Try to find JSON object directly
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            json_text = json_match.group(0)
        else:
            raise ValueError("No JSON found in response")
    
    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        # If parsing fails, try to clean up common issues
        json_text = re.sub(r',\s*}', '}', json_text)  # Remove trailing commas
        json_text = re.sub(r',\s*]', ']', json_text)  # Remove trailing commas in arrays
        return json.loads(json_text)

async def analyze_image_base64(image_base64: str) -> DesignAnalysisResponse:
    """Core analysis function that works with base64 image data"""
    try:
        # Create analysis prompt
        prompt = create_heuristic_prompt()
        
        # Get AI analysis
        ai_response = await analyze_design_with_ai(image_base64, prompt)
        
        # Parse JSON response with robust extraction
        try:
            analysis_data = extract_json_from_response(ai_response)
            return DesignAnalysisResponse(**analysis_data)
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback response if parsing fails
            return DesignAnalysisResponse(
                overall_score=75.0,
                heuristic_scores={key: 7.5 for key in UX_HEURISTICS.keys()},
                heuristic_reasoning={key: "Analysis parsing failed - generic score provided" for key in UX_HEURISTICS.keys()},
                recommendations=[f"JSON parsing failed: {str(e)}", "The AI provided an analysis but in an unexpected format"],
                strengths=["AI response received but parsing failed"],
                areas_for_improvement=["Please try uploading the image again"],
                summary="Analysis completed but detailed parsing failed - check server logs"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Comprehensive UX & Design System Evaluation Framework
# Nielsen's 10 Usability Heuristics + Modern Design System Principles
UX_HEURISTICS = {
    # === NIELSEN'S USABILITY HEURISTICS ===
    "visibility_of_system_status": "The system should keep users informed about what is happening",
    "match_system_real_world": "The system should speak the users' language and follow real-world conventions",
    "user_control_freedom": "Users need to feel in control and have clear ways to undo actions",
    "consistency_standards": "Follow platform conventions and maintain internal consistency",
    "error_prevention": "Prevent problems from occurring in the first place",
    "recognition_rather_than_recall": "Make elements visible rather than requiring memorization",
    "flexibility_efficiency": "Provide shortcuts and customization for expert users",
    "aesthetic_minimalist_design": "Avoid unnecessary elements and focus on essential content",
    "error_recovery": "Help users recognize, diagnose, and recover from errors",
    "help_documentation": "Provide easily searchable help when needed",
    
    # === DESIGN SYSTEM PRINCIPLES (Inspired by Red Hat Design System) ===
    "color_accessibility_usage": "Colors should be accessible, meaningful, and follow semantic usage patterns",
    "typography_hierarchy": "Text should establish clear hierarchy using appropriate scales, weights, and spacing",
    "design_token_consistency": "Visual properties should follow consistent token-based design patterns",
    "brand_voice_expression": "Design should authentically express brand personality and values",
    "responsive_adaptability": "Interface should work seamlessly across different screen sizes and contexts",
    "interaction_feedback": "User actions should provide clear, immediate, and appropriate feedback"
}

def validate_image(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    if not file.content_type or not file.content_type.startswith("image/"):
        return False
    
    # Check file size (max 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        return False
    
    return True

def image_to_base64(image_file: UploadFile) -> str:
    """Convert uploaded image to base64"""
    image_data = image_file.file.read()
    return base64.b64encode(image_data).decode()

async def analyze_design_with_ai(image_base64: str, analysis_prompt: str) -> str:
    """Send image to OpenAI for analysis"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": analysis_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1500
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

def create_heuristic_prompt() -> str:
    """Create prompt for heuristic evaluation"""
    # Separate Nielsen's heuristics from design system heuristics
    nielsen_heuristics = [
        "visibility_of_system_status", "match_system_real_world", "user_control_freedom",
        "consistency_standards", "error_prevention", "recognition_rather_than_recall",
        "flexibility_efficiency", "aesthetic_minimalist_design", "error_recovery", "help_documentation"
    ]
    
    design_system_heuristics = [
        "color_accessibility_usage", "typography_hierarchy", "design_token_consistency",
        "brand_voice_expression", "responsive_adaptability", "interaction_feedback"
    ]
    
    nielsen_list = "\n".join([f"- {key.replace('_', ' ').title()}: {UX_HEURISTICS[key]}" for key in nielsen_heuristics])
    design_system_list = "\n".join([f"- {key.replace('_', ' ').title()}: {UX_HEURISTICS[key]}" for key in design_system_heuristics])
    
    return f"""
    As a UX expert, analyze this design image using Jakob Nielsen's 10 usability heuristics and modern design system principles.

    CRITICAL: Your analysis must be based on SPECIFIC VISUAL ELEMENTS you can see in the image. Reference actual UI components, colors, text, buttons, layout elements, spacing, and design patterns that are visible.

    CLASSIC USABILITY HEURISTICS (Nielsen's):
    {nielsen_list}

    DESIGN SYSTEM EVALUATION CRITERIA (inspired by modern design systems like Red Hat's):
    {design_system_list}

    ANALYSIS APPROACH - For each heuristic, you MUST:
    1. OBSERVE: Identify SPECIFIC visual elements in the image (exact button text, specific color codes/names, pixel measurements, font sizes, spacing values, etc.)
    2. EVALUATE: Assess how these precise visible elements perform against the heuristic
    3. CITE: Reference the EXACT UI components, text content, colors, and measurements you're evaluating
    4. SCORE: Provide a score based on what you can actually see and measure

    MANDATORY SPECIFICITY REQUIREMENTS:
    - ALWAYS mention specific text you can read (button labels, headings, body text, etc.)
    - ALWAYS describe actual colors you see (e.g., "blue #2563eb", "light gray background", "white text")
    - ALWAYS reference specific UI components (e.g., "the red 'Submit' button", "the navigation menu with 4 items", "the search input field in the top-right")
    - ALWAYS mention measurable elements (spacing, sizes, alignment you can observe)
    - NEVER use generic phrases like "buttons" - say "the green 'Get Started' button" or "the three action buttons in the footer"

    DESIGN SYSTEM SPECIFIC GUIDANCE:
    - Color Accessibility Usage: Name specific colors you see, describe exact contrast relationships, identify which text/background combinations you're analyzing
    - Typography Hierarchy: Mention specific text content, describe exact size relationships you observe, reference particular headings or paragraphs
    - Design Token Consistency: Point to specific spacing measurements, identical button styles, repeated color usage you can see
    - Brand Voice Expression: Reference specific design choices visible (logo, color scheme, typography style, imagery) and what they communicate
    - Responsive Adaptability: Describe the actual layout structure, specific element positioning, and spacing patterns you observe
    - Interaction Feedback: Name specific interactive elements (buttons, links, form fields) and their visual states you can see

    EXAMPLE OF REQUIRED SPECIFICITY:
    Instead of: "The buttons have good contrast"
    Write: "The blue 'Sign Up' button (#2563eb) on white background provides strong contrast, while the 'Learn More' link in gray (#6b7280) may be harder to read"

    Instead of: "Good visual hierarchy"
    Write: "The main heading 'Welcome to Our Platform' uses large bold text (appears ~24px), followed by a descriptive paragraph in regular weight (~16px), creating clear information hierarchy"

    IMPORTANT: Respond with ONLY valid JSON. Do not include any explanatory text before or after the JSON.

    Provide your analysis in this exact JSON format:
    {{
        "overall_score": 85,
        "heuristic_scores": {{
            "visibility_of_system_status": 8.5,
            "match_system_real_world": 7.0,
            "user_control_freedom": 8.0,
            "consistency_standards": 9.0,
            "error_prevention": 7.5,
            "recognition_rather_than_recall": 8.5,
            "flexibility_efficiency": 6.5,
            "aesthetic_minimalist_design": 9.0,
            "error_recovery": 7.0,
            "help_documentation": 6.0,
            "color_accessibility_usage": 8.0,
            "typography_hierarchy": 7.5,
            "design_token_consistency": 8.5,
            "brand_voice_expression": 7.0,
            "responsive_adaptability": 6.5,
            "interaction_feedback": 8.0
        }},
        "heuristic_reasoning": {{
            "visibility_of_system_status": "I can see a blue progress bar showing 45% completion with 'Processing your request...' text in the header area, which clearly communicates current status. However, the 'Upload Files' button in the main content area doesn't show any loading state or feedback during file selection.",
            "match_system_real_world": "The interface uses familiar conventions like the shopping cart icon (🛒) next to 'Add to Cart' button text, and the search magnifying glass icon in the top navigation. However, the 'Finalize Transaction' button uses technical language instead of the more common 'Complete Purchase' or 'Place Order'.",
            "user_control_freedom": "I can see a breadcrumb navigation trail reading 'Home > Products > Widget Details' and a blue 'Back to Search Results' button in the top-left corner, providing clear escape routes. However, there's no visible 'Undo' option after clicking 'Add to Cart'.",
            "consistency_standards": "All primary buttons (like 'Get Started', 'Learn More', 'Contact Us') use identical styling: blue background (#2563eb), white text, 8px rounded corners, and 12px padding. The spacing between sections follows a consistent 24px grid pattern throughout.",
            "error_prevention": "The contact form shows red asterisks (*) next to 'Name' and 'Email' fields marking them as required, and the 'Send Message' button is grayed out until fields are completed. However, the phone number field lacks format hints like '(555) 123-4567'.",
            "recognition_rather_than_recall": "Each navigation icon includes descriptive text labels: 'Home', 'About', 'Services', 'Contact'. The current page 'Services' is highlighted with a blue underline, helping users recognize their location without memorizing the navigation structure.",
            "flexibility_efficiency": "The interface appears designed for basic users with no visible keyboard shortcuts, advanced search filters, or bulk actions. Power users would need to complete tasks through the standard click-through interface.",
            "aesthetic_minimalist_design": "The design uses a clean white background (#ffffff) with substantial 32px margins, limiting the color palette to blue (#2563eb), gray (#6b7280), and white. The main heading 'Transform Your Business' is prominently displayed with minimal competing elements.",
            "error_recovery": "I can see a red error message stating 'Please enter a valid email address' below the email field, but it doesn't provide examples of correct format or suggest fixes like 'Try: name@company.com'.",
            "help_documentation": "There are no visible help tooltips, '?' information icons, or 'Need Help?' links anywhere in the interface to assist users who might need guidance.",
            "color_accessibility_usage": "The blue 'Sign Up' button (#2563eb) on white background meets WCAG contrast standards, and red is used consistently for error states. However, the light gray placeholder text (#9ca3af) in form fields appears quite faint against the white background.",
            "typography_hierarchy": "The page title 'Welcome to Our Platform' uses bold 28px text, followed by the subtitle 'Build amazing things' in regular 18px, and body paragraphs in 16px. This creates clear information hierarchy, though some secondary labels could be slightly larger for better readability.",
            "design_token_consistency": "All interactive elements share consistent properties: 8px border radius for buttons and input fields, 16px internal padding, and identical hover effects (10% opacity change). The spacing follows an 8px grid system throughout.",
            "brand_voice_expression": "The prominent blue color (#2563eb), clean sans-serif typography, and professional photography communicate reliability and trustworthiness. The tone appears corporate and formal rather than playful or innovative.",
            "responsive_adaptability": "The main content is contained within a fixed 1200px wide container with large side margins, suggesting a desktop-first approach. I don't see mobile-specific navigation patterns like hamburger menus or touch-optimized button sizes.",
            "interaction_feedback": "The 'Get Started' button shows a darker blue shade (#1d4ed8) on hover, and form fields display a blue border when focused. The 'Services' tab in the navigation shows an active state with blue highlighting and underline."
        }},
        "recommendations": ["Improve error messaging clarity", "Add loading states for better feedback", "Consider mobile-first responsive design"],
        "strengths": ["Clean visual hierarchy", "Consistent color scheme", "Clear navigation structure"],
        "areas_for_improvement": ["Add accessibility features", "Improve error handling", "Optimize for mobile screens"],
        "summary": "Well-designed interface with strong visual consistency but could benefit from better accessibility and mobile optimization"
    }}

    Rules:
    - Overall score: 0-100 (integer)
    - Heuristic scores: 0-10 (decimal, one decimal place)
    - Heuristic reasoning: 1-2 sentences per heuristic explaining WHY that specific score was given
    - CRITICAL: Each reasoning MUST reference specific visual elements you observe (colors, text, buttons, spacing, icons, layouts, etc.)
    - DO NOT use generic terms - describe actual UI components you can see
    - Include specific measurements, colors, text content, and UI elements when possible
    - Include 3-5 specific recommendations based on observed issues
    - Include 3-4 key strengths citing specific visual elements
    - Include 3-4 areas for improvement referencing specific components
    - Summary should be 1-2 sentences about the overall visual design
    - Be specific and actionable in your recommendations
    - Base everything on what you can actually see in the design image
    - Consider accessibility, mobile responsiveness, and modern UX patterns
    - Return ONLY the JSON object, no additional text
    """

def create_comparison_prompt() -> str:
    """Create prompt for design comparison"""
    return """
    Compare these two design alternatives as a UX expert. Evaluate them based on:
    - Usability and user experience
    - Visual hierarchy and clarity
    - Accessibility considerations
    - Modern design principles
    - Task completion efficiency

    Provide your analysis in JSON format:
    {
        "winner": "design_a" | "design_b" | "tie",
        "reasoning": "Detailed explanation of the decision",
        "design_a_score": [0-100],
        "design_b_score": [0-100],
        "recommendations": ["how to improve the winning design", "general recommendations"]
    }

    Be objective and focus on user experience impact.
    """

@app.post("/", response_model=dict)
async def root():
    return {"message": "Design Evaluator API is running"}

@app.post("/analyze", response_model=DesignAnalysisResponse)
async def analyze_design(file: UploadFile = File(...)):
    """Analyze a single design using heuristic evaluation"""
    
    if not validate_image(file):
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    try:
        # Convert image to base64
        image_base64 = image_to_base64(file)
        
        # Create analysis prompt
        prompt = create_heuristic_prompt()
        
        # Get AI analysis
        ai_response = await analyze_design_with_ai(image_base64, prompt)
        
        # Parse JSON response with robust extraction
        import json
        import re
        
        def extract_json_from_response(text: str) -> dict:
            """Extract JSON from AI response, handling markdown code blocks and extra text"""
            # Remove markdown code blocks if present
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find JSON object in the text
                json_match = re.search(r'\{.*\}', text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    json_str = text.strip()
            
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                # If still can't parse, return None
                return None
        
        try:
            analysis_result = extract_json_from_response(ai_response)
            if analysis_result:
                return DesignAnalysisResponse(**analysis_result)
            else:
                # Log the actual response for debugging
                print(f"Failed to parse AI response: {ai_response[:500]}...")
                raise json.JSONDecodeError("Could not extract valid JSON", ai_response, 0)
        except (json.JSONDecodeError, TypeError, KeyError) as e:
            # Fallback with more helpful error message
            return DesignAnalysisResponse(
                overall_score=75.0,
                heuristic_scores={key: 7.5 for key in UX_HEURISTICS.keys()},
                heuristic_reasoning={key: "Analysis parsing failed - generic score provided" for key in UX_HEURISTICS.keys()},
                recommendations=[f"JSON parsing failed: {str(e)}", "The AI provided an analysis but in an unexpected format"],
                strengths=["AI response received but parsing failed"],
                areas_for_improvement=["Please try uploading the image again"],
                summary="Analysis completed but detailed parsing failed - check server logs"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/compare", response_model=ComparisonResponse)
async def compare_designs(
    design_a: UploadFile = File(...),
    design_b: UploadFile = File(...)
):
    """Compare two design alternatives"""
    
    if not validate_image(design_a) or not validate_image(design_b):
        raise HTTPException(status_code=400, detail="Invalid image file(s)")
    
    try:
        # Convert both images to base64
        image_a_base64 = image_to_base64(design_a)
        image_b_base64 = image_to_base64(design_b)
        
        # Create comparison prompt with both images
        prompt = f"{create_comparison_prompt()}\n\nDesign A (first image) vs Design B (second image):"
        
        # Analyze both designs using the full heuristic framework
        heuristic_prompt = create_heuristic_prompt()
        
        # Get full analysis for both designs
        response_a = await analyze_design_with_ai(image_a_base64, heuristic_prompt)
        response_b = await analyze_design_with_ai(image_b_base64, heuristic_prompt)
        
        # Parse both analyses
        import json
        import re
        
        def extract_json_from_response(text: str) -> dict:
            """Extract JSON from AI response, handling markdown code blocks and extra text"""
            # Remove markdown code blocks if present
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find JSON object in the text
                json_match = re.search(r'\{.*\}', text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    json_str = text.strip()
            
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                return None
        
        # Parse both analyses
        analysis_a = extract_json_from_response(response_a)
        analysis_b = extract_json_from_response(response_b)
        
        # Extract scores (with fallbacks)
        score_a = analysis_a.get("overall_score", 75.0) if analysis_a else 75.0
        score_b = analysis_b.get("overall_score", 75.0) if analysis_b else 75.0
        
        # Determine winner based on actual scores
        if abs(score_a - score_b) < 5:  # Within 5 points = tie
            winner = "tie"
        elif score_a > score_b:
            winner = "design_a"
        else:
            winner = "design_b"
        
        # Create detailed reasoning
        reasoning_parts = []
        if analysis_a:
            reasoning_parts.append(f"Design A scored {score_a}/100. " + (analysis_a.get("summary", "Well-structured design.")))
        if analysis_b:
            reasoning_parts.append(f"Design B scored {score_b}/100. " + (analysis_b.get("summary", "Clean interface design.")))
        
        if winner == "tie":
            reasoning_parts.append(f"The designs are very close in quality (difference: {abs(score_a - score_b):.1f} points).")
        else:
            higher_score = max(score_a, score_b)
            lower_score = min(score_a, score_b)
            reasoning_parts.append(f"The winning design scored {higher_score - lower_score:.1f} points higher.")
        
        reasoning = " ".join(reasoning_parts)
        
        # Generate recommendations
        recommendations = []
        if analysis_a and "recommendations" in analysis_a:
            recommendations.extend(analysis_a["recommendations"][:2])
        if analysis_b and "recommendations" in analysis_b:
            recommendations.extend(analysis_b["recommendations"][:2])
        
        if not recommendations:
            recommendations = [
                "Focus on improving visual hierarchy and consistency",
                "Consider user testing to validate the design choice",
                "Iterate on the weaker areas identified in the analysis"
            ]
        
        # Create detailed breakdowns for each design
        design_a_breakdown = None
        design_b_breakdown = None
        
        if analysis_a:
            design_a_breakdown = {
                "overall_score": analysis_a.get("overall_score", score_a),
                "heuristic_scores": analysis_a.get("heuristic_scores", {}),
                "heuristic_reasoning": analysis_a.get("heuristic_reasoning", {}),
                "recommendations": analysis_a.get("recommendations", []),
                "strengths": analysis_a.get("strengths", []),
                "areas_for_improvement": analysis_a.get("areas_for_improvement", []),
                "summary": analysis_a.get("summary", "Analysis completed.")
            }
        
        if analysis_b:
            design_b_breakdown = {
                "overall_score": analysis_b.get("overall_score", score_b),
                "heuristic_scores": analysis_b.get("heuristic_scores", {}),
                "heuristic_reasoning": analysis_b.get("heuristic_reasoning", {}),
                "recommendations": analysis_b.get("recommendations", []),
                "strengths": analysis_b.get("strengths", []),
                "areas_for_improvement": analysis_b.get("areas_for_improvement", []),
                "summary": analysis_b.get("summary", "Analysis completed.")
            }
        
        comparison_result = {
            "winner": winner,
            "reasoning": reasoning,
            "design_a_score": float(score_a),
            "design_b_score": float(score_b),
            "recommendations": recommendations[:4],  # Limit to 4 recommendations
            "design_a_analysis": design_a_breakdown,
            "design_b_analysis": design_b_breakdown
        }
        
        return ComparisonResponse(**comparison_result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@app.post("/analyze-url", response_model=DesignAnalysisResponse)
async def analyze_url(request: URLAnalysisRequest):
    """Analyze design from a URL by taking a screenshot"""
    try:
        print(f"DEBUG: Starting URL analysis for: {request.url}")
        
        # Capture screenshot of the URL
        print(f"DEBUG: Capturing screenshot...")
        screenshot_base64 = await capture_screenshot(request.url)
        print(f"DEBUG: Screenshot captured, length: {len(screenshot_base64)}")
        
        # Use core analysis function
        print(f"DEBUG: Starting AI analysis...")
        result = await analyze_image_base64(screenshot_base64)
        print(f"DEBUG: Analysis completed successfully")
        
        return result
    
    except Exception as e:
        error_msg = f"URL analysis failed: {type(e).__name__}: {str(e)}"
        print(f"ERROR: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/compare-urls", response_model=ComparisonResponse)
async def compare_urls(request: URLAnalysisRequest):
    """Compare two designs from URLs by taking screenshots"""
    try:
        if not request.comparison_url:
            raise HTTPException(status_code=400, detail="comparison_url is required for URL comparison")
        
        # Capture screenshots of both URLs
        screenshot_a = await capture_screenshot(request.url)
        screenshot_b = await capture_screenshot(request.comparison_url)
        
        # Perform analysis on both designs
        analysis_a = await analyze_image_base64(screenshot_a)
        analysis_b = await analyze_image_base64(screenshot_b)
        
        # Determine winner based on overall scores
        winner = "Design A" if analysis_a.overall_score > analysis_b.overall_score else "Design B"
        score_a = analysis_a.overall_score
        score_b = analysis_b.overall_score
        
        # Generate comparison reasoning
        reasoning = f"{winner} performs better with a score of {max(score_a, score_b):.1f} compared to {min(score_a, score_b):.1f}. "
        
        # Create recommendations based on both analyses
        recommendations = []
        recommendations.extend(analysis_a.recommendations[:2])
        recommendations.extend(analysis_b.recommendations[:2])
        
        # Create detailed breakdowns for each design (URL comparison)
        design_a_breakdown = {
            "overall_score": analysis_a.overall_score,
            "heuristic_scores": analysis_a.heuristic_scores,
            "heuristic_reasoning": analysis_a.heuristic_reasoning,
            "recommendations": analysis_a.recommendations,
            "strengths": analysis_a.strengths,
            "areas_for_improvement": analysis_a.areas_for_improvement,
            "summary": analysis_a.summary
        }
        
        design_b_breakdown = {
            "overall_score": analysis_b.overall_score,
            "heuristic_scores": analysis_b.heuristic_scores,
            "heuristic_reasoning": analysis_b.heuristic_reasoning,
            "recommendations": analysis_b.recommendations,
            "strengths": analysis_b.strengths,
            "areas_for_improvement": analysis_b.areas_for_improvement,
            "summary": analysis_b.summary
        }

        comparison_result = {
            "winner": winner,
            "reasoning": reasoning,
            "design_a_score": float(score_a),
            "design_b_score": float(score_b),
            "recommendations": recommendations[:4],
            "design_a_analysis": design_a_breakdown,
            "design_b_analysis": design_b_breakdown
        }
        
        return ComparisonResponse(**comparison_result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL comparison failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Design Evaluator API is operational"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)