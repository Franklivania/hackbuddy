package user

import (
	"hackbuddy-backend/db"
	"hackbuddy-backend/domains/auth"
)

type Repository interface {
	FindByID(id string) (*auth.User, error)
	FindAll() ([]auth.User, error)
	UpdateUser(user *auth.User) error
	SoftDelete(id string) error
	UnscopedDelete(id string) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) FindByID(id string) (*auth.User, error) {
	var user auth.User
	err := db.DB.Where("id = ?", id).First(&user).Error
	return &user, err
}

func (r *repository) FindAll() ([]auth.User, error) {
	var users []auth.User
	err := db.DB.Find(&users).Error
	return users, err
}

func (r *repository) UpdateUser(user *auth.User) error {
	return db.DB.Save(user).Error
}

func (r *repository) SoftDelete(id string) error {
	return db.DB.Delete(&auth.User{}, "id = ?", id).Error
}

func (r *repository) UnscopedDelete(id string) error {
	return db.DB.Unscoped().Delete(&auth.User{}, "id = ?", id).Error
}
