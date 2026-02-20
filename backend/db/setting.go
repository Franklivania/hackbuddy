package db

// Setting stores key-value app settings (e.g. llm_active_model for admin override).
type Setting struct {
	Key   string `gorm:"primaryKey;type:varchar(255)" json:"key"`
	Value string `gorm:"type:text" json:"value"`
}

// GetSetting returns the value for key, or empty string if not found.
func GetSetting(key string) (string, error) {
	var s Setting
	err := DB.Where("key = ?", key).First(&s).Error
	if err != nil {
		return "", err
	}
	return s.Value, nil
}

// SetSetting upserts a key-value setting.
func SetSetting(key, value string) error {
	var s Setting
	err := DB.Where("key = ?", key).First(&s).Error
	if err != nil {
		return DB.Create(&Setting{Key: key, Value: value}).Error
	}
	s.Value = value
	return DB.Save(&s).Error
}
