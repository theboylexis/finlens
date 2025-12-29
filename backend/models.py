"""
Pydantic models for request/response validation.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date as DateType, datetime as DateTimeType
from enum import Enum


class CategorizationMethod(str, Enum):
    """Method used for categorization."""
    REGEX = "regex"
    AI = "ai"
    MANUAL = "manual"


class OperationType(str, Enum):
    """Type of AI operation."""
    CATEGORIZE = "categorize"
    QUERY = "query"
    INSIGHT = "insight"


# ============================================================================
# Expense Models
# ============================================================================

class ExpenseCreate(BaseModel):
    """Request model for creating an expense."""
    amount: float = Field(..., gt=0, description="Expense amount (must be positive)")
    description: str = Field(..., min_length=1, max_length=500, description="Expense description")
    category: Optional[str] = Field(None, description="Category (if manually specified)")
    date: DateType = Field(..., description="Expense date")
    payment_method: Optional[str] = Field(None, max_length=50, description="Payment method")
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: str) -> str:
        """Ensure description is not just whitespace."""
        if not v.strip():
            raise ValueError("Description cannot be empty or whitespace")
        return v.strip()


class ExpenseResponse(BaseModel):
    """Response model for expense data."""
    id: int
    amount: float
    description: str
    category: str
    date: DateType
    payment_method: Optional[str]
    
    # AI metadata
    ai_suggested_category: Optional[str]
    confidence_score: Optional[float]
    categorization_method: str
    user_overridden: bool
    
    # OCR metadata
    raw_ocr_text: Optional[str]
    receipt_image_path: Optional[str]
    
    created_at: DateTimeType
    updated_at: DateTimeType
    
    class Config:
        from_attributes = True


class ExpenseUpdate(BaseModel):
    """Request model for updating an expense."""
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    category: Optional[str] = None
    date: Optional[DateType] = None
    payment_method: Optional[str] = Field(None, max_length=50)


# ============================================================================
# Category Models
# ============================================================================

class CategorySuggestion(BaseModel):
    """AI category suggestion with confidence."""
    category: str
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0-1)")
    method: CategorizationMethod
    reasoning: Optional[str] = Field(None, description="Explanation for the suggestion")


class CategoryResponse(BaseModel):
    """Response model for category data."""
    id: int
    name: str
    icon: str
    color: str
    description: str
    
    class Config:
        from_attributes = True


# ============================================================================
# Budget Models
# ============================================================================

class BudgetCreate(BaseModel):
    """Request model for creating a budget."""
    category: str
    monthly_limit: float = Field(..., gt=0, description="Monthly budget limit")


class BudgetResponse(BaseModel):
    """Response model for budget data."""
    id: int
    category: str
    monthly_limit: float
    created_at: DateTimeType
    updated_at: DateTimeType
    
    class Config:
        from_attributes = True


class BudgetStatus(BaseModel):
    """Budget status with spending information."""
    category: str
    monthly_limit: float
    current_spending: float
    remaining: float
    percentage_used: float
    is_over_budget: bool
    daily_allowance: float  # Remaining budget / days left in month


# ============================================================================
# Natural Language Query Models
# ============================================================================

class NLQueryRequest(BaseModel):
    """Request model for natural language query."""
    query: str = Field(..., min_length=1, max_length=500, description="Natural language query")


class NLQueryResponse(BaseModel):
    """Response model for natural language query results."""
    query: str
    intent: str
    data: dict
    explanation: str
    sql_template_used: str
    confidence: float


# ============================================================================
# Insight Models
# ============================================================================

class DataSource(BaseModel):
    """Reference to data source for insight."""
    expense_id: int
    amount: float
    description: str
    date: DateType


class InsightResponse(BaseModel):
    """Response model for AI-generated insight."""
    type: str
    title: str
    explanation: str
    data_sources: List[DataSource]
    confidence: float
    timestamp: DateTimeType


# ============================================================================
# Audit Log Models
# ============================================================================

class AuditLogEntry(BaseModel):
    """Audit log entry for AI operations."""
    id: int
    expense_id: Optional[int]
    operation_type: OperationType
    input_text: str
    output_text: str
    model_used: str
    confidence_score: Optional[float]
    prompt_tokens: Optional[int]
    completion_tokens: Optional[int]
    latency_ms: Optional[int]
    timestamp: DateTimeType
    
    class Config:
        from_attributes = True


# ============================================================================
# Analytics Models
# ============================================================================

class SpendingByCategory(BaseModel):
    """Spending aggregated by category."""
    category: str
    total: float
    count: int
    percentage: float


class SpendingTrend(BaseModel):
    """Spending trend over time."""
    date: DateType
    total: float


class AnalyticsSummary(BaseModel):
    """Overall analytics summary."""
    total_expenses: float
    expense_count: int
    average_expense: float
    top_category: str
    top_category_amount: float
    date_range_start: DateType
    date_range_end: DateType


class CategoryBudgetStatus(BaseModel):
    """Budget status for a specific category."""
    category: str
    limit: float
    spent: float
    remaining: float
    percentage_used: float
    status: str  # 'safe', 'warning', 'exceeded'


class SafeToSpendResponse(BaseModel):
    """Safe to spend calculation response."""
    safe_to_spend_today: float = Field(..., description="Amount safe to spend today")
    total_budget: float = Field(..., description="Total monthly budget across all categories")
    spent_this_month: float = Field(..., description="Total spent this month")
    goals_reserved: float = Field(..., description="Amount reserved for savings goals")
    remaining_budget: float = Field(..., description="Budget remaining after spending")
    days_remaining: int = Field(..., description="Days remaining in the month")
    status: str = Field(..., description="Status: 'healthy', 'caution', or 'danger'")
    # Budget tracking fields
    categories_over_budget: List[CategoryBudgetStatus] = Field(default_factory=list, description="Categories exceeding their limits")
    categories_near_limit: List[CategoryBudgetStatus] = Field(default_factory=list, description="Categories at 80%+ usage")
    total_budget_limit: float = Field(default=0.0, description="Sum of all budget limits")
    has_budget_warnings: bool = Field(default=False, description="True if any category is near or over limit")


# ============================================================================
# Savings Goals Models
# ============================================================================

class GoalCreate(BaseModel):
    """Request model for creating a savings goal."""
    name: str = Field(..., min_length=1, max_length=100, description="Goal name")
    target_amount: float = Field(..., gt=0, description="Target savings amount")
    target_date: Optional[DateType] = Field(None, description="Optional target date")
    icon: Optional[str] = Field("🎯", max_length=10, description="Goal icon emoji")
    color: Optional[str] = Field("#6366f1", max_length=20, description="Goal color")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Ensure name is not just whitespace."""
        if not v.strip():
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip()


class GoalUpdate(BaseModel):
    """Request model for updating a savings goal."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_amount: Optional[float] = Field(None, gt=0)
    target_date: Optional[DateType] = None
    icon: Optional[str] = Field(None, max_length=10)
    color: Optional[str] = Field(None, max_length=20)


class GoalResponse(BaseModel):
    """Response model for savings goal data."""
    id: int
    name: str
    target_amount: float
    current_amount: float
    target_date: Optional[DateType]
    icon: str
    color: str
    is_completed: bool
    completed_at: Optional[DateTimeType]
    created_at: DateTimeType
    updated_at: DateTimeType
    
    # Computed fields
    progress_percentage: float
    days_remaining: Optional[int]
    
    class Config:
        from_attributes = True


class ContributionCreate(BaseModel):
    """Request model for adding a contribution to a goal."""
    amount: float = Field(..., gt=0, description="Contribution amount")
    note: Optional[str] = Field(None, max_length=200, description="Optional note")


class ContributionResponse(BaseModel):
    """Response model for goal contribution data."""
    id: int
    goal_id: int
    amount: float
    note: Optional[str]
    created_at: DateTimeType
    
    class Config:
        from_attributes = True


# ============================================================================
# Alert Models
# ============================================================================

class AlertType(str, Enum):
    """Type of alert."""
    BUDGET_WARNING = "budget_warning"
    WEEKLY_SUMMARY = "weekly_summary"
    GOAL_REACHED = "goal_reached"


class AlertResponse(BaseModel):
    """Response model for alert data."""
    id: int
    type: str
    title: str
    message: str
    category: Optional[str]
    threshold_percent: Optional[int]
    is_read: bool
    is_dismissed: bool
    created_at: DateTimeType
    
    class Config:
        from_attributes = True


class BudgetStatusWithAlert(BaseModel):
    """Extended budget status with alert information."""
    category: str
    monthly_limit: float
    current_spending: float
    remaining: float
    percentage_used: float
    is_over_budget: bool
    daily_allowance: float
    alert_level: str  # 'safe', 'warning', 'danger', 'exceeded'
    alert_message: Optional[str]


class AlertsSummary(BaseModel):
    """Summary of unread alerts."""
    unread_count: int
    alerts: List[AlertResponse]


# ============================================================================
# Split Bills Models
# ============================================================================

class FriendCreate(BaseModel):
    """Request model for creating a friend."""
    name: str = Field(..., min_length=1, max_length=100, description="Friend's name")
    email: Optional[str] = Field(None, max_length=100, description="Friend's email")
    phone: Optional[str] = Field(None, max_length=20, description="Friend's phone")
    avatar_color: Optional[str] = Field("#6366f1", max_length=20, description="Avatar color")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class FriendResponse(BaseModel):
    """Response model for friend data."""
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    avatar_color: str
    created_at: DateTimeType
    
    class Config:
        from_attributes = True


class SplitCreate(BaseModel):
    """Request model for splitting an expense."""
    friend_id: int = Field(..., description="Friend to split with")
    amount: float = Field(..., gt=0, description="Amount this friend owes")


class SplitExpenseRequest(BaseModel):
    """Request to split an expense with multiple friends."""
    splits: List[SplitCreate] = Field(..., min_length=1, description="List of splits")


class SplitResponse(BaseModel):
    """Response model for expense split."""
    id: int
    expense_id: int
    friend_id: int
    friend_name: str
    amount: float
    is_settled: bool
    settled_at: Optional[DateTimeType]
    created_at: DateTimeType
    
    class Config:
        from_attributes = True


class BalanceSummary(BaseModel):
    """Summary of balances with a friend."""
    friend_id: int
    friend_name: str
    friend_email: Optional[str]
    avatar_color: str
    total_owed: float  # Positive = they owe you
    unsettled_count: int


class BalancesResponse(BaseModel):
    """Response with all balance summaries."""
    total_owed_to_you: float
    balances: List[BalanceSummary]


# ============================================================================
# Subscription Models
# ============================================================================

class BillingCycle(str, Enum):
    """Billing cycle options."""
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionCreate(BaseModel):
    """Request model for creating a subscription."""
    name: str = Field(..., min_length=1, max_length=100, description="Subscription name")
    amount: float = Field(..., gt=0, description="Subscription amount")
    billing_cycle: BillingCycle = Field(..., description="Billing frequency")
    next_renewal: DateType = Field(..., description="Next renewal date")
    category: Optional[str] = Field(None, max_length=50, description="Category")
    reminder_days: int = Field(3, ge=0, le=30, description="Days before renewal to remind")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class SubscriptionUpdate(BaseModel):
    """Request model for updating a subscription."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    billing_cycle: Optional[BillingCycle] = None
    next_renewal: Optional[DateType] = None
    category: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    reminder_days: Optional[int] = Field(None, ge=0, le=30)
    notes: Optional[str] = Field(None, max_length=500)


class SubscriptionResponse(BaseModel):
    """Response model for subscription data."""
    id: int
    name: str
    amount: float
    billing_cycle: str
    next_renewal: DateType
    category: Optional[str]
    is_active: bool
    reminder_days: int
    notes: Optional[str]
    created_at: DateTimeType
    updated_at: DateTimeType
    
    # Computed fields
    days_until_renewal: Optional[int] = None
    monthly_cost: float = 0.0  # Normalized to monthly
    
    class Config:
        from_attributes = True


# ============================================================================
# Rebuild models for Pydantic v2 compatibility with `from __future__ import annotations`
# ============================================================================
ExpenseCreate.model_rebuild()
ExpenseResponse.model_rebuild()
ExpenseUpdate.model_rebuild()
CategorySuggestion.model_rebuild()
CategoryResponse.model_rebuild()
BudgetCreate.model_rebuild()
BudgetResponse.model_rebuild()
BudgetStatus.model_rebuild()
NLQueryRequest.model_rebuild()
NLQueryResponse.model_rebuild()
DataSource.model_rebuild()
InsightResponse.model_rebuild()
AuditLogEntry.model_rebuild()
SpendingByCategory.model_rebuild()
SpendingTrend.model_rebuild()
AnalyticsSummary.model_rebuild()
SafeToSpendResponse.model_rebuild()
GoalCreate.model_rebuild()
GoalUpdate.model_rebuild()
GoalResponse.model_rebuild()
ContributionCreate.model_rebuild()
ContributionResponse.model_rebuild()
AlertResponse.model_rebuild()
BudgetStatusWithAlert.model_rebuild()
AlertsSummary.model_rebuild()
FriendCreate.model_rebuild()
FriendResponse.model_rebuild()
SplitCreate.model_rebuild()
SplitExpenseRequest.model_rebuild()
SplitResponse.model_rebuild()
BalanceSummary.model_rebuild()
BalancesResponse.model_rebuild()
SubscriptionCreate.model_rebuild()
SubscriptionUpdate.model_rebuild()
SubscriptionResponse.model_rebuild()


# ============================================================================
# Income Models
# ============================================================================

class IncomeCreate(BaseModel):
    """Request model for adding income."""
    amount: float = Field(..., gt=0, description="Income amount")
    source: str = Field(..., min_length=1, max_length=100, description="Source of income (e.g. Job)")
    category: str = Field(..., min_length=1, max_length=50, description="Category (e.g. Salary, Gift)")
    date: DateType = Field(..., description="Date received")
    is_recurring: bool = Field(False, description="Is this a recurring income?")

class IncomeResponse(BaseModel):
    """Response model for income data."""
    id: int
    user_id: int
    amount: float
    source: str
    category: str
    date: DateType
    is_recurring: bool
    created_at: DateTimeType
    
    class Config:
        from_attributes = True



