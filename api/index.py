from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from api.engine import generate_motor_design_logic
from api.ml_model import get_ml_insights

app = FastAPI()

# Enable CORS for local development and Vercel hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok", "engine": "MotorMorph AI v2.0 (Python)"}

@app.post("/api/generate-design")
async def generate_design(inputs: dict = Body(...)):
    # 1. Run physics engine
    design_results = generate_motor_design_logic(inputs)
    
    # 2. Enhance with ML insights
    ml_insights = get_ml_insights(inputs, design_results)
    
    # 3. Merge and return
    design_results['ml_insights'] = ml_insights
    
    # Update accuracy note to reflect ML involvement
    design_results['accuracy']['note'] += " Results refined by AI/ML prediction model."
    
    return design_results

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
