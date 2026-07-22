import requests
import json
import sys

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "llama3"

def main():
    print("==================================================")
    print("🤖 Ollama Interactive Interview Tester")
    print("==================================================")
    print(f"Connecting to: {OLLAMA_URL} using model '{MODEL}'")
    
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert technical interviewer. "
                "Your task is to ask the candidate technical questions one by one. "
                "Wait for their answer, evaluate it briefly, and then ask the next question. "
                "Keep your responses concise."
            )
        },
        {
            "role": "user",
            "content": "Hi! I am ready for the interview. Please ask me the first question."
        }
    ]
    
    # Test connection first
    try:
        requests.get("http://localhost:11434/")
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Could not connect to Ollama.")
        print("Please ensure Ollama is running (e.g. run 'ollama run llama3' in a separate terminal).")
        sys.exit(1)

    while True:
        print("\nThinking...", end="", flush=True)
        try:
            payload = {
                "model": MODEL,
                "messages": messages,
                "stream": False
            }
            response = requests.post(OLLAMA_URL, json=payload, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            ai_message = data["message"]["content"]
            
            # Add AI response to history
            messages.append({"role": "assistant", "content": ai_message})
            
            # Print AI response
            print("\r\033[K" + "\033[96mAI:\033[0m " + ai_message)
            
            # Get user input
            user_input = input("\n\033[92mYou:\033[0m ")
            
            if user_input.lower() in ["quit", "exit", "stop"]:
                print("Ending interview test. Goodbye!")
                break
                
            # Add user input to history
            messages.append({"role": "user", "content": user_input})
            
        except Exception as e:
            print(f"\n[ERROR] Failed to communicate with Ollama: {str(e)}")
            break

if __name__ == "__main__":
    main()
