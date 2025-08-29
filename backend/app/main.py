from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"post_details_list": "Hello World"}