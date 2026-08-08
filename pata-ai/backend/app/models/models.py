from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class AddressResolveRequest(BaseModel):
    address: str = Field(..., description="Unstructured Indian address string containing landmarks, local spellings, etc.")
    user_id: Optional[int] = Field(None, description="The ID of the user submitting the request")
    target_language: Optional[str] = Field(None, description="Selected output translation language (supporting 100+ families)")


class EvidenceItem(BaseModel):
    source: str
    description: str
    score: float

class AddressResolveResponse(BaseModel):
    original_address: str
    normalized_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: float
    evidence: List[str]
    correction_explanation: str
    risk_warning: Optional[str] = None
    latency_ms: float
    cost_inr: float = 0.05
    cost_usd: float = 0.0006
    model_used: str = "Hybrid Pipeline (Gemini Flash & Classical Solver)"
    parsed_components: Optional[dict] = None
    pois: Optional[List[dict]] = None



class PincodeDetailSchema(BaseModel):
    pincode: str
    office: str
    district: str
    state: str
    latitude: float
    longitude: float

    model_config = ConfigDict(from_attributes=True)

class UserSchema(BaseModel):
    id: int
    username: str
    role: str

    model_config = ConfigDict(from_attributes=True)

class BulkResolveRequest(BaseModel):
    addresses: List[str]
    user_id: Optional[int] = None

class BulkResolveItem(BaseModel):
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: float
    status: str
