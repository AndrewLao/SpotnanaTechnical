# Description
This project was made for a technical interview for Spotnana. It's a lightweight AI chat interface that uses React, SQLite, and FastAPI.

# How to Run

It's a single page React and FastAPI app that is just a chat interface. You will need an OpenAI API key to test the application.

Navigate to the `spotnana_technical` folder. This is the frontend. Go ahead and run the following commands:

```
npm -i
npm run dev
```

In another terminal, navigate to the backend folder.

Init a virtual Python environment so you don't pollute your system. The command may vary on Windows.

`python -m venv venv && source venv/bin/activate`

Make a `.env` file in the backend folder, copy-paste the variable in `.env_example` into it, and replace the example with your API key.

Run `pip install -r requirements.txt` to install the dependencies.

Then, run `python main.py` to start the backend server. 

Reload the web page and you can start trying out the app. 

