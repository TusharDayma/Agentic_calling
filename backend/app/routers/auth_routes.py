from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User, UserRole
from app.auth import get_password_hash, verify_password, create_access_token, RoleChecker

router = APIRouter(prefix="/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: UserRole

    class Config:
        from_attributes = True

@router.post("/signup", response_model=UserResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Registers a new user, hardcoded to HR role."""
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered."
        )

    hashed = get_password_hash(req.password)
    user = User(
        username=req.username,
        hashed_password=hashed,
        role=UserRole.HR
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Logs in user and returns JWT token + role."""
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )
    
    token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value,
        "username": user.username
    }

# Example of using RoleChecker
@router.get("/admin-only")
def admin_only(token_payload: dict = Depends(RoleChecker([UserRole.ADMIN]))):
    return {"message": "Welcome Admin", "user": token_payload.get("sub")}

@router.get("/me", response_model=UserResponse)
def get_me(token_payload: dict = Depends(RoleChecker([UserRole.ADMIN, UserRole.HR])), db: Session = Depends(get_db)):
    """Returns profile information for the authenticated active user."""
    username = token_payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
