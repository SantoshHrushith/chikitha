import os
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

# === Load environment variables ===
load_dotenv(find_dotenv())
os.environ["OPENAI_API_KEY"] = os.environ.get("GROQ_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# === FastAPI app setup ===
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Request schema ===
class ChatRequest(BaseModel):
    question: str

# === Prompt template ===
prompt = PromptTemplate(
    template="""
Use the pieces of information provided in the context to answer user's question.
If you dont know the answer, just say that you dont know, dont try to make up an answer. 
Dont provide anything out of the given context.If context given is small and relevant ask to elaborate. If any offensive or vulgar language is used ask apology.

Context: {context}
Question: {question}

Start the answer directly. No small talk please.

Answer:
""",
    input_variables=["context", "question"]
)

# === Load FAISS and embeddings ===
embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
db = FAISS.load_local("vector/db_faiss", embedding_model, allow_dangerous_deserialization=True)

# === Memory for multi-turn conversation ===
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)

# === Load Groq LLM ===
llm = ChatOpenAI(
    openai_api_base="https://api.groq.com/openai/v1",
    openai_api_key=GROQ_API_KEY,
    model="llama3-8b-8192",
    temperature=0.4,
    max_tokens=512
)

# === Build QA chain ===
qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=db.as_retriever(search_kwargs={"k": 5}),
    memory=memory,
    return_source_documents=True,
    combine_docs_chain_kwargs={"prompt": prompt},
    output_key="answer"
)

# === Define POST endpoint ===
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        result = qa_chain.invoke({"question": request.question})
        return {"answer": result["answer"]}
    except Exception as e:
        return {"error": str(e)}
