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

async def capture_screenshot(url: str) -> str:
    """
    Capture a screenshot of the given URL and return it as base64 string
    """
    try:
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        async with async_playwright() as p:
            # Launch browser in headless mode
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Set viewport size for consistent screenshots
            await page.set_viewport_size({"width": 1200, "height": 800})
            
            # Navigate to URL with timeout
            await page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Wait a bit for dynamic content to load
            await page.wait_for_timeout(2000)
            
            # Take full page screenshot
            screenshot_bytes = await page.screenshot(full_page=True, type='png')
            
            # Close browser
            await browser.close()
            
            # Convert to base64
            screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            return screenshot_base64
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to capture screenshot: {str(e)}")

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
    heuristic_scores: dict
    heuristic_reasoning: dict
    strengths: List[str]
    areas_for_improvement: List[str]
    summary: str

class ComparisonResponse(BaseModel):
    winner: str  # "design_a", "design_b", or "tie"
    reasoning: str
    design_a_score: float
    design_b_score: float
    recommendations: List[str]
    design_a_analysis: Optional[DesignBreakdown] = None
    design_b_analysis: Optional[DesignBreakdown] = None

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
    1. OBSERVE: Identify specific visual elements in the image (buttons, text, colors, spacing, icons, navigation, etc.)
    2. EVALUATE: Assess how these visible elements perform against the heuristic
    3. CITE: Reference the actual UI components you're evaluating in your reasoning
    4. SCORE: Provide a score based on what you can actually see

    DESIGN SYSTEM SPECIFIC GUIDANCE:
    - Color Accessibility Usage: Examine visible color contrast, identify color choices you can see, assess semantic color usage
    - Typography Hierarchy: Analyze visible text sizes, weights, spacing, and hierarchy in the actual design
    - Design Token Consistency: Look for consistent spacing, sizing, and visual patterns visible in the interface
    - Brand Voice Expression: Evaluate how the visible design elements communicate brand personality
    - Responsive Adaptability: Assess layout structure, spacing, and element sizing visible in the design
    - Interaction Feedback: Examine visible button states, interactive elements, and feedback mechanisms

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
            "visibility_of_system_status": "The blue progress bar at 45% completion and 'Processing...' text in the top-right clearly indicate current system status, though the upload button lacks visual feedback during file selection.",
            "match_system_real_world": "The shopping cart icon and 'Add to Cart' button text use familiar e-commerce conventions, but the 'Finalize Purchase' label could be clearer than this technical term.",
            "user_control_freedom": "The visible breadcrumb navigation (Home > Products > Details) and blue 'Back to Results' button provide clear escape routes, but no visible undo option after adding items to cart.",
            "consistency_standards": "All buttons use the same blue (#2563eb) background with white text and 8px border radius, and spacing between elements follows a consistent 16px grid pattern.",
            "error_prevention": "The form shows red asterisks (*) for required fields and the grayed-out 'Submit' button prevents submission, but lacks input format hints for the phone number field.",
            "recognition_rather_than_recall": "Icons include text labels (like 'Search' next to the magnifying glass) and the navigation menu shows current page highlighting, reducing memory load.",
            "flexibility_efficiency": "The interface shows only basic interaction patterns with no visible keyboard shortcuts or advanced features for experienced users.",
            "aesthetic_minimalist_design": "Clean white background with generous 24px margins, limited to 3 colors (blue, gray, white), and clear visual hierarchy from large heading to smaller body text.",
            "error_recovery": "A red error message reads 'Invalid email format' but doesn't suggest the correct format or provide examples of valid emails.",
            "help_documentation": "No visible help text, tooltips, or '?' icons are present in the interface to guide users.",
            "color_accessibility_usage": "The blue buttons (#2563eb) on white background provide good contrast, and red is used semantically for errors, though gray text appears quite light against white.",
            "typography_hierarchy": "Clear hierarchy with 24px heading, 16px body text, and 12px captions, all using consistent line spacing, though some secondary text could be larger for better readability.",
            "design_token_consistency": "Consistent 8px border radius on all buttons and input fields, 16px padding throughout, and uniform color palette suggests systematic design token usage.",
            "brand_voice_expression": "The clean, minimal aesthetic with blue accent color suggests a professional, trustworthy brand, though lacks distinctive personality beyond generic corporate styling.",
            "responsive_adaptability": "The centered 400px-wide layout with fixed margins suggests desktop-first design, with no visible mobile navigation patterns or flexible spacing.",
            "interaction_feedback": "Buttons show darker blue hover states and the selected tab has a blue underline, providing clear interactive feedback."
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
                "heuristic_scores": analysis_a.get("heuristic_scores", {}),
                "heuristic_reasoning": analysis_a.get("heuristic_reasoning", {}),
                "strengths": analysis_a.get("strengths", []),
                "areas_for_improvement": analysis_a.get("areas_for_improvement", []),
                "summary": analysis_a.get("summary", "Analysis completed.")
            }
        
        if analysis_b:
            design_b_breakdown = {
                "heuristic_scores": analysis_b.get("heuristic_scores", {}),
                "heuristic_reasoning": analysis_b.get("heuristic_reasoning", {}),
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
        # Capture screenshot of the URL
        screenshot_base64 = await capture_screenshot(request.url)
        
        # Create a design analysis request with the screenshot
        analysis_request = DesignAnalysisRequest(
            image_data=screenshot_base64,
            analysis_type="heuristic"
        )
        
        # Use core analysis function
        return await analyze_image_base64(screenshot_base64)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL analysis failed: {str(e)}")

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
        
        comparison_result = {
            "winner": winner,
            "reasoning": reasoning,
            "design_a_score": float(score_a),
            "design_b_score": float(score_b),
            "recommendations": recommendations[:4],
            "design_a_analysis": analysis_a.dict(),
            "design_b_analysis": analysis_b.dict()
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