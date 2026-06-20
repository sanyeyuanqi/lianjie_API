/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

type imageCaptchaVerifyRequest struct {
	Key    string                      `json:"key" binding:"required"`
	Points []service.ImageCaptchaPoint `json:"points" binding:"required"`
}

func GetImageCaptcha(c *gin.Context) {
	if !common.ImageCaptchaEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "图像验证未启用",
		})
		return
	}
	data, err := service.GenerateImageCaptcha(c.ClientIP())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
}

func VerifyImageCaptcha(c *gin.Context) {
	if !common.ImageCaptchaEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "图像验证未启用",
		})
		return
	}
	var request imageCaptchaVerifyRequest
	if err := c.ShouldBindJSON(&request); err != nil || request.Key == "" || len(request.Points) == 0 {
		common.ApiErrorMsg(c, "图像验证参数无效")
		return
	}
	token, err := service.VerifyImageCaptcha(request.Key, request.Points, c.ClientIP())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"token": token,
		},
	})
}
