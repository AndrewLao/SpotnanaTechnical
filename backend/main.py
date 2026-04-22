import os
import uvicorn

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv

from database import init_db, save_message, get_all_messages, clear_messages

load_dotenv()

# Constants
MAX_PROMPT_LENGTH = (
    500  # Max length of input. A bit short, but easier to showcase at this level.
)
MAX_CONTEXT_MESSAGES = 50  # Max history to consider so we don't overload our OpenAI API


# Small class for the chat function request model
# You could put this in a separate file but I feel that it's small enough to put here
class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=MAX_PROMPT_LENGTH)


#  Simply starts the database up when the server launches
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Chatbot API", lifespan=lifespan)

# Cors management
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# System prompt for AI personality.
SYSTEM_PROMPT = """
                    You are Anna, a warm and concise assistant of the company Spotnana. 
                    Your task is to answer the user's questions concisely and accurately. 
                    Keep answers short unless told to elaborate.
                    If the user's request isn't clear, ask the user to clarify what they want.
                """


@app.post("/api/chat")
def chat(req: ChatRequest):
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # Save the user's message before calling the model so it's persisted
    # even if the API call fails.
    user_msg = save_message(role="user", content=prompt)

    try:
        # Get messages and uses the limit we specified earlier
        history = get_all_messages(limit=MAX_CONTEXT_MESSAGES)
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + [
            {"role": m["role"], "content": m["content"]} for m in history
        ]

        # Typical ChatGPT pattern
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )
        reply = completion.choices[0].message.content or ""
    except Exception as e:
        # Here to avoid printing a stack trace to the user
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    assistant_msg = save_message(role="assistant", content=reply)

    return {
        "user_message": user_msg,
        "assistant_message": assistant_msg,
    }


# database.py call
@app.get("/api/history")
def history():
    return {"messages": get_all_messages()}


# database.py call
@app.delete("/api/history")
def clear_history():
    clear_messages()
    return {"ok": True}


# Standard Python startup
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
