"""Pydantic models for CarbonLens API requests and responses."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


# ------------------------------------------------------------------
# Request models
# ------------------------------------------------------------------

class VerifyRequest(BaseModel):
    company_name: str


# MeasureRequest is a file upload — handled via FastAPI's UploadFile,
# not a Pydantic model.  We keep a placeholder here for documentation.


# ------------------------------------------------------------------
# Job / polling models
# ------------------------------------------------------------------

class AgentStatus(BaseModel):
    name: str
    status: str = "pending"  # pending | running | complete | error
    message: str = ""
    summary: str = ""


class JobStatus(BaseModel):
    job_id: str
    status: str = "running"  # running | complete | error
    current_agent: int = 0
    agents: list[AgentStatus] = Field(default_factory=list)
    result: Any | None = None


# ------------------------------------------------------------------
# Verify-mode result sub-models
# ------------------------------------------------------------------

class TransparencyBreakdown(BaseModel):
    completeness: int = 0
    consistency: int = 0
    verifiability: int = 0
    ambition: int = 0


class TransparencyScore(BaseModel):
    overall: int = 0
    breakdown: TransparencyBreakdown = Field(default_factory=TransparencyBreakdown)


class ClaimExtracted(BaseModel):
    text: str
    category: str = ""
    scope: str = ""
    metric_type: str = ""
    value: Any | None = None
    unit: str = ""
    baseline_year: int | None = None
    page: int | None = None


class Evidence(BaseModel):
    source: str = ""
    detail: str = ""
    url: str = ""


class Finding(BaseModel):
    severity: str = ""       # high | medium | low | info
    type: str = ""           # e.g. INTENSITY_VS_ABSOLUTE, MISSING_SCOPE, …
    title: str = ""
    description: str = ""
    claim_refs: list[int] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)


class Estimation(BaseModel):
    estimated_total: float = 0
    reported_scope1_2: float = 0
    estimated_scope3: float = 0
    scope3_percent: float = 0


class VerifyResult(BaseModel):
    company: dict = Field(default_factory=dict)
    transparency_score: TransparencyScore = Field(default_factory=TransparencyScore)
    claims_extracted: list[ClaimExtracted] = Field(default_factory=list)
    findings: list[Finding] = Field(default_factory=list)
    estimation: Estimation = Field(default_factory=Estimation)
    executive_summary: str = ""
    methodology: str = ""


# ------------------------------------------------------------------
# Measure-mode result sub-models
# ------------------------------------------------------------------

class MeasureSummary(BaseModel):
    total_scope3_kgco2e: float = 0
    total_scope3_tco2e: float = 0
    line_items_processed: int = 0
    confidence: str = ""
    caveat: str = ""


class Scope3Category(BaseModel):
    category_number: int
    category_name: str
    emissions_kgco2e: float = 0
    percent_of_total: float = 0
    top_contributors: list[str] = Field(default_factory=list)


class SupplierEmission(BaseModel):
    supplier_name: str
    total_emissions: float = 0
    total_spend: float = 0
    emission_intensity: float = 0
    rank: int = 0
    percent_of_total: float = 0


class Hotspot(BaseModel):
    type: str = ""
    title: str = ""
    description: str = ""
    emissions: float = 0
    percent_of_total: float = 0


class Recommendation(BaseModel):
    priority: str = ""
    target: str = ""
    recommendation: str = ""
    potential_reduction: str = ""
    difficulty: str = ""
    timeframe: str = ""


class MeasureResult(BaseModel):
    summary: MeasureSummary = Field(default_factory=MeasureSummary)
    by_scope3_category: list[Scope3Category] = Field(default_factory=list)
    by_supplier: list[SupplierEmission] = Field(default_factory=list)
    hotspots: list[Hotspot] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list)
