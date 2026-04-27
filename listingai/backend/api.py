import json
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()


class GenerateRequest(BaseModel):
    address: str = Field(..., min_length=1)
    bedrooms: int = Field(..., ge=0)
    bathrooms: int = Field(..., ge=0)
    sqft: int = Field(..., ge=0)
    price: float = Field(..., ge=0)
    property_type: str = Field(..., min_length=1)
    amenities: str = Field(default="")
    neighborhood_highlights: str = Field(default="")
    tone: str = Field(default="Standard")


class Variation(BaseModel):
    tone: str
    description: str


class GenerateResponse(BaseModel):
    variations: list[Variation]


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


PROMPT_TEMPLATE = """You are an expert real estate copywriter. Generate 3 different 
listing descriptions for the following property:

Address: {address}
Type: {property_type}
Bedrooms: {bedrooms} | Bathrooms: {bathrooms}
Square Footage: {sqft} sqft
Price: ${price}
Amenities: {amenities}
Neighborhood: {neighborhood_highlights}

Generate exactly 3 descriptions:
1. LUXURY: Sophisticated, premium language targeting high-end buyers
2. STANDARD: Professional, warm, and inviting for general market
3. CONCISE: Short, punchy, fact-focused for quick readers

Format response as JSON:
{{
  "variations": [
    {{"tone": "Luxury", "description": "..."}},
    {{"tone": "Standard", "description": "..."}},
    {{"tone": "Concise", "description": "..."}}
  ]
}}
"""


def _coerce_variations(payload: Any) -> list[dict[str, str]]:
    if not isinstance(payload, dict):
        raise ValueError("Model did not return a JSON object.")
    variations = payload.get("variations")
    if not isinstance(variations, list):
        raise ValueError("Missing 'variations' list in response.")

    by_tone: dict[str, str] = {}
    for item in variations:
        if not isinstance(item, dict):
            continue
        tone = str(item.get("tone", "")).strip()
        desc = str(item.get("description", "")).strip()
        if tone and desc:
            by_tone[tone.lower()] = desc

    ordered = []
    for tone in ("Luxury", "Standard", "Concise"):
        desc = by_tone.get(tone.lower())
        if not desc:
            raise ValueError(f"Missing description for tone '{tone}'.")
        ordered.append({"tone": tone, "description": desc})
    return ordered


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest) -> GenerateResponse:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set.")

    client = OpenAI(api_key=api_key)

    prompt = PROMPT_TEMPLATE.format(
        address=req.address.strip(),
        property_type=req.property_type.strip(),
        bedrooms=req.bedrooms,
        bathrooms=req.bathrooms,
        sqft=req.sqft,
        price=req.price,
        amenities=(req.amenities or "").strip(),
        neighborhood_highlights=(req.neighborhood_highlights or "").strip(),
    )

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return ONLY valid JSON. Use double quotes."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            response_format={"type": "json_object"},
        )
        content = (resp.choices[0].message.content or "").strip()
        data = json.loads(content)
        variations = _coerce_variations(data)
        return GenerateResponse(variations=[Variation(**v) for v in variations])
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=502, detail=f"Bad model response: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")

