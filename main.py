from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import anthropic
import asyncio
import uvicorn
import os

app = FastAPI()

# Create static directory if it doesn't exist
if not os.path.exists("static"):
    os.makedirs("static")

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")
client = anthropic.AsyncAnthropic()

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/generate-component")
async def generate_component(request: Request):
    data = await request.json()
    user_prompt = data.get("prompt", "")
    existing_code = data.get("existing_code", "")
    is_modification = data.get("is_modification", False)
    request_id = data.get("request_id", "")
    
    print(f"\n🤖 [Request {request_id}] {'Modifying' if is_modification else 'Generating new'} component")
    print(f"Prompt: '{user_prompt}'")
    print("⏳ Waiting for Claude's response...")
    
    if is_modification:
        system_prompt = """You are a UI component modifier. You will receive the current HTML/CSS/JS of a component and 
        instructions for modifications. Return the modified component in this format:
        <component>HTML code here</component> <script>JavaScript code here (optional)</script>
        Use Tailwind CSS for styling. Preserve the existing structure and functionality unless specifically asked to change it.
        Only include JavaScript if the component needs interactivity."""
        
        content_prompt = f"""Modify this existing component based on these instructions: {user_prompt}
        
        Existing component code:
        {existing_code}
        
        Return the modified version while maintaining the component's core functionality unless specifically asked to change it."""
    else:
        system_prompt = """You are a UI component generator. Return components in this format: 
        <component>HTML code here</component> <script>JavaScript code here (optional)</script>
        Use Tailwind CSS for styling. Components should be responsive and well-structured.
        Only include JavaScript if the component needs interactivity."""
        
        content_prompt = f"Generate a UI component based on this description: {user_prompt}"
    
    message = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1000,
        temperature=0,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": content_prompt
                    }
                ]
            }
        ]
    )
    
    print(f"✨ [Request {request_id}] Component successfully generated!")
    response = message.content[0].text
    return {"component": response, "request_id": request_id}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
