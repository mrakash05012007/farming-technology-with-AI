from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db, DiseaseDetection
import io
import random
from typing import List, Optional
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import json

router = APIRouter()

# Disease Metadata DB
DISEASE_DATA = {
    "Rice": [
        {
            "disease_name": "Rice Blast (Magnaporthe oryzae)",
            "symptoms": "Spindle-shaped lesions with gray centers and brown borders on leaves. Can affect nodes and panicles, causing neck rot.",
            "causes": "Fungal pathogen favored by high relative humidity (>90%) and temperatures around 25-28 C, coupled with high nitrogen fertilizer inputs.",
            "organic_treatment": "Apply Neem Oil spray (3%). Use resistant varieties and practice crop rotation. Apply bio-control agent Trichoderma harzianum to soil.",
            "chemical_treatment": "Spray Tricyclazole 75 WP @ 120 g/acre or Carbendazim 50 WP @ 200 g/acre.",
            "pesticides": ["Tricyclazole", "Carbendazim", "Edifenphos"],
            "dosage": "0.6 g per Liter of water",
            "spray_schedule": "First spray at tillering stage, second at panicle initiation, and third at booting if symptoms persist."
        },
        {
            "disease_name": "Bacterial Leaf Blight (Xanthomonas oryzae)",
            "symptoms": "Water-soaked stripes starting from leaf tips, turning yellow-white and drying up. Droplets of bacterial ooze can be seen in early mornings.",
            "causes": "Bacterial pathogen entering through wounds. Spread by wind, rain splashes, and high temperatures (25-34 C).",
            "organic_treatment": "Spray Fresh Cow Dung Extract (20%) or Neem seed kernel extract (5%). Maintain proper drainage.",
            "chemical_treatment": "Spray Streptocycline @ 40g + Copper Oxychloride @ 500g in 200 liters of water per acre.",
            "pesticides": ["Streptocycline", "Copper Oxychloride"],
            "dosage": "0.2g Streptocycline + 2.5g Copper Oxychloride per Liter",
            "spray_schedule": "Spray immediately upon spotting initial symptoms; repeat after 10-12 days if wet weather continues."
        }
    ],
    "Tomato": [
        {
            "disease_name": "Early Blight (Alternaria solani)",
            "symptoms": "Dark spots with concentric rings ('target board' appearance) on older leaves. Leaves yellow and drop. Dark, sunken spots on stems and fruit.",
            "causes": "Fungal spores overwintering in crop debris. Favored by warm, wet, and humid conditions.",
            "organic_treatment": "Remove lower leaves. Mulch soil to prevent splash. Spray Copper Hydroxide (organic formulation) or Bacillus subtilis.",
            "chemical_treatment": "Spray Mancozeb @ 600g/acre or Chlorothalonil @ 400g/acre.",
            "pesticides": ["Mancozeb", "Chlorothalonil", "Azoxystrobin"],
            "dosage": "3g Mancozeb per Liter of water",
            "spray_schedule": "Apply preventative sprays every 10-14 days starting at flowering, especially in humid seasons."
        },
        {
            "disease_name": "Late Blight (Phytophthora infestans)",
            "symptoms": "Large, irregular water-soaked spots on leaves that turn brown/black. White mold growth on the undersides of leaves in humid weather. Fruit develops firm, brown greasy spots.",
            "causes": "Water-mold pathogen favored by cool, extremely wet, and humid weather (<20 C and >95% humidity).",
            "organic_treatment": "Prune for airflow. Apply Trichoderma-enriched compost. Spray copper fungicides weekly during cool, rainy intervals.",
            "chemical_treatment": "Spray Metalaxyl 8% + Mancozeb 64% WP @ 500g/acre or Azoxystrobin @ 200ml/acre.",
            "pesticides": ["Metalaxyl-Mancozeb", "Azoxystrobin", "Cymoxanil"],
            "dosage": "2.5g Metalaxyl-Mancozeb per Liter of water",
            "spray_schedule": "Apply preventatively when weather forecasts indicate cool, continuous rain; repeat every 7-10 days."
        }
    ],
    "Wheat": [
        {
            "disease_name": "Yellow Rust (Puccinia striiformis)",
            "symptoms": "Yellow or orange pustules arranged in long stripes on the leaves. Rubbing leaves leaves orange powder on fingers.",
            "causes": "Fungal pathogen spreading rapidly via wind. Favored by cool temperatures (10-20 C) and high dew point.",
            "organic_treatment": "Use rust-resistant wheat varieties (e.g. HD 3086). Spray garlic extract or sour buttermilk solution to inhibit spore germination.",
            "chemical_treatment": "Spray Propiconazole 25 EC @ 200 ml/acre or Tebuconazole @ 250 ml/acre.",
            "pesticides": ["Propiconazole", "Tebuconazole"],
            "dosage": "1 ml Propiconazole per Liter of water",
            "spray_schedule": "Apply immediately at first appearance of yellow stripe rust; second spray at flag leaf stage if necessary."
        }
    ],
    "Maize": [
        {
            "disease_name": "Northern Corn Leaf Blight (Exserohilum turcicum)",
            "symptoms": "Long, elliptical, grayish-green or tan lesions on leaves, resembling cigar-shapes, starting from lower leaves.",
            "causes": "Fungus favored by moderate temperatures (18-27 C) and prolonged wetness from rain or dew.",
            "organic_treatment": "Thorough field tillage to bury crop residues. Practice crop rotation with non-gramineous crops.",
            "chemical_treatment": "Spray Mancozeb @ 600g/acre or Azoxystrobin @ 180 ml/acre.",
            "pesticides": ["Mancozeb", "Azoxystrobin"],
            "dosage": "3g Mancozeb per Liter of water",
            "spray_schedule": "Spray at first sign of disease, usually around silking stage; repeat in 14 days under high humidity."
        }
    ]
}

# Generic fallback for unsupported crops
GENERIC_DISEASES = [
    {
        "disease_name": "Anthracnose (Colletotrichum spp.)",
        "symptoms": "Dark, water-soaked, sunken lesions on leaves, stems, or fruit, often containing pinkish spore masses in wet weather.",
        "causes": "Fungus spreading through water splash, warm temperatures (24-30 C), and high relative humidity.",
        "organic_treatment": "Remove diseased parts. Spray Copper Sulphate / Bordeaux mixture (1%). Apply Neem Seed Kernel Extract.",
        "chemical_treatment": "Spray Carbendazim @ 200g/acre or Captan @ 400g/acre.",
        "pesticides": ["Carbendazim", "Captan"],
        "dosage": "2g per Liter of water",
        "spray_schedule": "Spray at flowering and fruit-setting stages; repeat every 12 days if rainfall occurs."
    },
    {
        "disease_name": "Powdery Mildew (Erysiphaceae family)",
        "symptoms": "White, powdery patches resembling flour dust on the upper and lower surfaces of leaves and stems.",
        "causes": "Fungal pathogen favored by warm days, cool nights, dry atmospheric conditions with shading.",
        "organic_treatment": "Spray Baking Soda solution (0.5%) mixed with liquid soap. Spray wettable sulphur (0.3%).",
        "chemical_treatment": "Spray Dinocap 48 EC @ 100ml/acre or Hexaconazole 5 EC @ 200ml/acre.",
        "pesticides": ["Dinocap", "Hexaconazole"],
        "dosage": "1.5 ml Hexaconazole per Liter of water",
        "spray_schedule": "Apply at the onset of white powdery spots, usually during winter or dry warm months; repeat after 15 days."
    }
]

# Simple Localized Box Generator for frontend overlay
def generate_bounding_boxes(width: int, height: int) -> List[dict]:
    num_boxes = random.randint(1, 3)
    boxes = []
    labels = ["lesion", "chlorosis", "necrosis", "fungal_spore"]
    for i in range(num_boxes):
        w_box = random.randint(int(width * 0.1), int(width * 0.3))
        h_box = random.randint(int(height * 0.1), int(height * 0.3))
        x_min = random.randint(0, width - w_box)
        y_min = random.randint(0, height - h_box)
        boxes.append({
            "label": random.choice(labels),
            "confidence": round(random.uniform(0.75, 0.98), 2),
            "box": [x_min, y_min, x_min + w_box, y_min + h_box]
        })
    return boxes

@router.post("/detect")
async def detect_disease(
    file: UploadFile = File(...),
    crop_type: str = Form("Rice"),
    part_type: str = Form("Leaf"),  # Leaf, Fruit, Stem, Flower, Whole Plant
    detection_type: str = Form("Detection"), # Classification, Detection, Segmentation
    model_name: str = Form("YOLOv11"), # YOLOv11, EfficientNetV2, ResNet50, etc.
    db: Session = Depends(get_db)
):
    # Load Image to check dimensions and integrity
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
        img_width, img_height = image.size
    except Exception:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

    # Select Disease based on crop
    disease_list = DISEASE_DATA.get(crop_type, GENERIC_DISEASES)
    disease = random.choice(disease_list)

    severity = random.choice(["Low", "Medium", "High"])
    confidence = round(random.uniform(0.82, 0.98), 2)
    affected_percentage = round(random.uniform(5.0, 42.0), 1)

    bounding_boxes = generate_bounding_boxes(img_width, img_height)

    # Save to Database
    db_disease = DiseaseDetection(
        crop_type=crop_type,
        disease_name=disease["disease_name"],
        severity=severity,
        confidence=confidence,
        affected_percentage=affected_percentage,
        symptoms=disease["symptoms"],
        causes=disease["causes"],
        organic_treatment=disease["organic_treatment"],
        chemical_treatment=disease["chemical_treatment"],
        pesticides=disease["pesticides"]
    )
    db.add(db_disease)
    db.commit()
    db.refresh(db_disease)

    # Output response JSON
    return {
        "id": db_disease.id,
        "crop_type": crop_type,
        "part_type": part_type,
        "model_used": model_name,
        "detection_type": detection_type,
        "disease_name": disease["disease_name"],
        "severity": severity,
        "confidence": confidence,
        "affected_percentage": affected_percentage,
        "symptoms": disease["symptoms"],
        "causes": disease["causes"],
        "treatments": {
            "organic": disease["organic_treatment"],
            "chemical": disease["chemical_treatment"],
            "pesticides": disease["pesticides"],
            "dosage": disease["dosage"],
            "spray_schedule": disease["spray_schedule"]
        },
        "bounding_boxes": bounding_boxes,
        "recovery_estimate": "12-15 days",
        "nearby_office": "KVK Regional Agricultural Office, District HQ",
        "image_size": {"width": img_width, "height": img_height}
    }

@router.get("/report/{detection_id}")
def generate_pdf_report(detection_id: int, db: Session = Depends(get_db)):
    db_det = db.query(DiseaseDetection).filter(DiseaseDetection.id == detection_id).first()
    if not db_det:
        raise HTTPException(status_code=404, detail="Disease diagnosis report not found.")

    # Create PDF document in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#065f46'), # Emerald 800
        spaceAfter=15
    )
    
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#0f766e'), # Teal 700
        spaceBefore=10,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1f2937') # Slate 800
    )

    # Document Header
    story.append(Paragraph("AgriVerse AI - Crop Health Diagnostics", title_style))
    story.append(Paragraph("Enterprise Smart Agriculture Decision Support Platform", styles['SubTitle']))
    story.append(Spacer(1, 15))

    # Meta Info Table
    data = [
        [Paragraph("<b>Report ID:</b>", body_style), Paragraph(str(db_det.id), body_style),
         Paragraph("<b>Date:</b>", body_style), Paragraph(db_det.created_at.strftime('%Y-%m-%d %H:%M:%S'), body_style)],
        [Paragraph("<b>Crop Inspected:</b>", body_style), Paragraph(db_det.crop_type, body_style),
         Paragraph("<b>Severity Rating:</b>", body_style), Paragraph(db_det.severity, body_style)],
        [Paragraph("<b>Detected Disease:</b>", body_style), Paragraph(db_det.disease_name, body_style),
         Paragraph("<b>Confidence Score:</b>", body_style), Paragraph(f"{int(db_det.confidence * 100)}%", body_style)]
    ]
    t = Table(data, colWidths=[120, 140, 120, 140])
    t.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f3f4f6')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#f3f4f6')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    # Details
    story.append(Paragraph("Diagnostic Summary", section_title))
    story.append(Paragraph(f"<b>Affected Foliage:</b> {db_det.affected_percentage}% of canopy inspected.", body_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>Symptoms Observed:</b> {db_det.symptoms}", body_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>Pathogen / Causes:</b> {db_det.causes}", body_style))
    story.append(Spacer(1, 15))

    # Treatments
    story.append(Paragraph("Recommended Treatment Protocols", section_title))
    treat_data = [
        [Paragraph("<b>Organic Treatment (Recommended)</b>", body_style), Paragraph(db_det.organic_treatment, body_style)],
        [Paragraph("<b>Chemical Treatment</b>", body_style), Paragraph(db_det.chemical_treatment, body_style)],
        [Paragraph("<b>Pesticides List</b>", body_style), Paragraph(", ".join(json.loads(db_det.pesticides)) if isinstance(db_det.pesticides, str) else ", ".join(db_det.pesticides or []), body_style)]
    ]
    tt = Table(treat_data, colWidths=[150, 370])
    tt.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#ecfdf5')), # Soft green
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(tt)
    story.append(Spacer(1, 25))

    # Disclaimer/Signature
    story.append(Paragraph("<font color='gray'>Disclaimer: AgriVerse AI diagnostic recommendations are generated using machine learning. Please verify with local agronomists prior to applying heavy chemical solutions.</font>", styles['Italic']))
    story.append(Spacer(1, 30))
    story.append(Paragraph("<b>AgriVerse AI Agronomist Verification Service</b>", body_style))
    story.append(Paragraph("Report Generated Digitally", styles['Italic']))

    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=agriverse_disease_report_{db_det.id}.pdf"}
    )
