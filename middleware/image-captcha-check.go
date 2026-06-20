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
package middleware

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

func ImageCaptchaCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !common.ImageCaptchaEnabled {
			c.Next()
			return
		}
		if !service.ConsumeImageCaptchaToken(c.Query("captcha_token"), c.ClientIP()) {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "请先完成图像验证",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
