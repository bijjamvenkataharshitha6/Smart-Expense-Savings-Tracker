from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
