package auth

import (
	"errors"
	"time"

	"hackbuddy-backend/db"
)

const verificationCodeTTL = 15 * time.Minute

type Repository interface {
	CreateUser(user *User) error
	FindByEmail(email string) (*User, error)
	FindByProvider(provider, providerID string) (*User, error)
	FindByID(id string) (*User, error)
	UpdateUser(user *User) error
	StoreVerificationCode(email, code string) error
	GetVerificationCode(email string) (string, error)
	DeleteVerificationCode(email string) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) CreateUser(user *User) error {
	return db.DB.Create(user).Error
}

func (r *repository) FindByEmail(email string) (*User, error) {
	var user User
	err := db.DB.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *repository) FindByProvider(provider, providerID string) (*User, error) {
	var user User
	err := db.DB.Where("provider = ? AND provider_id = ?", provider, providerID).First(&user).Error
	return &user, err
}

func (r *repository) FindByID(id string) (*User, error) {
	var user User
	err := db.DB.Where("id = ?", id).First(&user).Error
	return &user, err
}

func (r *repository) UpdateUser(user *User) error {
	return db.DB.Save(user).Error
}

func (r *repository) StoreVerificationCode(email, code string) error {
	ver := EmailVerification{
		Email:     email,
		Code:      code,
		ExpiresAt: time.Now().Add(verificationCodeTTL),
	}
	return db.DB.Save(&ver).Error
}

func (r *repository) GetVerificationCode(email string) (string, error) {
	var ver EmailVerification
	err := db.DB.Where("email = ?", email).First(&ver).Error
	if err != nil {
		return "", err
	}
	if time.Now().After(ver.ExpiresAt) {
		return "", errors.New("verification code expired")
	}
	return ver.Code, nil
}

func (r *repository) DeleteVerificationCode(email string) error {
	return db.DB.Delete(&EmailVerification{}, "email = ?", email).Error
}
