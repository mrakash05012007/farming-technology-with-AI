from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db, ChatHistory
import datetime

router = APIRouter()

class ChatQueryInput(BaseModel):
    session_id: str
    message: str
    language: Optional[str] = "English"
    voice_response: Optional[bool] = False

class ChatMessageResponse(BaseModel):
    role: str
    message: str
    sources: List[str]
    suggested_questions: List[str]
    audio_base64: Optional[str] = None  # Mock TTS stream if requested

# Static Knowledge Base (RAG Mock)
KNOWLEDGE_BASE = [
    {
        "keywords": ["pest", "insect", "aphid", "caterpillar", "armyworm", "pesticide"],
        "source": "ICAR Insect Pest Management Manual (2024)",
        "content": "For lepidopteran pests like Armyworm or Helicoverpa, biological control using Bacillus thuringiensis (Bt) @ 2g/liter or Neem Seed Kernel Extract (5%) is highly effective. In severe infestations, spray Spinosad 45 SC @ 0.3 ml/liter."
    },
    {
        "keywords": ["fertilizer", "urea", "nitrogen", "potash", "phosphate", "npk"],
        "source": "KVK Fertilizer Application Guidelines",
        "content": "A balanced N:P:K ratio of 4:2:1 is recommended for cereal crops. For soils deficient in nitrogen, apply urea in split doses: 50% basal, 25% at tillering, and 25% at flowering to avoid leaching losses."
    },
    {
        "keywords": ["drip", "sprinkler", "irrigation", "water", "save"],
        "source": "Pradhan Mantri Krishi Sinchayee Yojana Guidelines",
        "content": "Drip irrigation saves up to 45% water compared to flood irrigation. It maintains soil moisture near field capacity and reduces weed growth. Subsidies up to 80% are available for small and marginal farmers."
    },
    {
        "keywords": ["scheme", "subsidy", "pm-kisan", "pmfby", "insurance", "loan"],
        "source": "Ministry of Agriculture - Government Schemes Handbook",
        "content": "Under PM-KISAN, farmers receive INR 6,000 annually in three installments. PM Fasal Bima Yojana (PMFBY) covers crop losses due to natural calamities with a premium of only 2% for Kharif and 1.5% for Rabi crops."
    },
    {
        "keywords": ["organic", "compost", "vermicompost", "manure", "panchagavya"],
        "source": "National Centre of Organic and Natural Farming Manual",
        "content": "To transition to organic farming, apply 5 tons of vermicompost per acre. Use Panchagavya (a blend of cow dung, urine, milk, curd, and ghee) as a foliar spray @ 3% concentration to boost plant immunity and growth."
    }
]

DEFAULT_RESPONSES = {
    "English": "I have searched the ICAR and Ministry of Agriculture databases. Here is the relevant advice for your query. For best results, ensure you have input your soil health details in the Crop Recommendation module.",
    "Hindi": "मैंने आईसीएआर और कृषि मंत्रालय के डेटाबेस में खोज की है। आपकी पूछताछ के लिए यहाँ प्रासंगिक सलाह दी गई है।",
    "Tamil": "நான் ICAR மற்றும் விவசாய அமைச்சகத்தின் தரவுத்தளங்களில் தேடினேன். உங்கள் கேள்விக்கான பொருத்தமான ஆலோசனை இதோ.",
    "Telugu": "నేను ICAR మరియు వ్యవసాయ మంత్రిత్వ శాఖ డేటాబేస్లలో శోధించాను. మీ ప్రశ్నకు సంబంధిత సలహా ఇక్కడ ఉంది."
}

SUGGESTED_QS = {
    "English": ["How can I apply for PMFBY crop insurance?", "What is the organic treatment for tomato leaf blight?", "How do I calculate NPK fertilizer dosage?"],
    "Hindi": ["पीएमएफबीवाई फसल बीमा के लिए कैसे आवेदन करें?", "टमाटर के झुलसा रोग का जैविक उपचार क्या है?", "एनपीके उर्वरक खुराक की गणना कैसे करें?"],
    "Tamil": ["PMFBY பயிர் காப்பீட்டுக்கு எவ்வாறு விண்ணப்பிப்பது?", "தக்காளி இலை கருகல் நோய்க்கான இயற்கை சிகிச்சை என்ன?", "NPK உர அளவை எவ்வாறு கணக்கிடுவது?"],
    "Telugu": ["PMFBY పంట భీమా కోసం ఎలా దరఖాస్తు చేయాలి?", "టమోటా ఆకు తెగులుకు సేంద్రీయ చికిత్స ఏమిటి?", "NPK ఎరువుల మోతాదును ఎలా లెక్కించాలి?"]
}

@router.post("/query", response_model=ChatMessageResponse)
def query_chatbot(payload: ChatQueryInput, db: Session = Depends(get_db)):
    msg_lower = payload.message.lower()
    
    # Save User Message to History
    user_chat = ChatHistory(session_id=payload.session_id, role="user", message=payload.message)
    db.add(user_chat)
    
    # RAG Matching
    matched_sources = []
    response_paragraphs = []
    
    for item in KNOWLEDGE_BASE:
        if any(kw in msg_lower for kw in item["keywords"]):
            matched_sources.append(item["source"])
            response_paragraphs.append(item["content"])
            
    # Default response if no RAG match
    if not response_paragraphs:
        matched_sources.append("AgriVerse AI Knowledge Agent")
        if payload.language == "Hindi":
            response_paragraphs.append("कृपया मुझे अपनी फसल, मिट्टी या मौसम से संबंधित समस्या के बारे में विस्तार से बताएं ताकि मैं आईसीएआर पुस्तिकाओं से सटीक जानकारी खोज सकूं।")
        elif payload.language == "Tamil":
            response_paragraphs.append("உங்கள் பயிர், மண் அல்லது வானிலை தொடர்பான பிரச்சனையைப் பற்றி மேலும் விவரங்களை வழங்கவும், இதனால் நான் சிறந்த ஆலோசனையைக் கண்டறிய முடியும்.")
        else:
            response_paragraphs.append("I couldn't find a direct match in my local manuals. Based on general agricultural science, it is recommended to maintain balanced soil pH, monitor water stress via moisture sensors, and check local weather alerts before applying fertilizer or pesticide sprays.")

    response_text = "\n\n".join(response_paragraphs)
    prefix = DEFAULT_RESPONSES.get(payload.language, DEFAULT_RESPONSES["English"])
    full_response = f"{prefix}\n\n{response_text}"
    
    # Save Assistant Message to History
    assistant_chat = ChatHistory(session_id=payload.session_id, role="assistant", message=full_response)
    db.add(assistant_chat)
    db.commit()
    
    # Mock voice synthesis base64 (if requested)
    audio_data = None
    if payload.voice_response:
        # Returning a tiny mock base64 audio string to simulate text-to-speech stream
        audio_data = "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA"

    suggested = SUGGESTED_QS.get(payload.language, SUGGESTED_QS["English"])

    return ChatMessageResponse(
        role="assistant",
        message=full_response,
        sources=matched_sources,
        suggested_questions=suggested,
        audio_base64=audio_data
    )

@router.post("/upload-pdf")
async def upload_knowledge_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    # In a real app, parse PDF text using PyPDF / PDFPlumber and index into FAISS/ChromaDB.
    # Here we mock indexing.
    return {
        "filename": file.filename,
        "status": "indexed",
        "chunks_extracted": random.randint(15, 80),
        "message": f"Successfully parsed and loaded '{file.filename}' into the RAG vector index."
    }
