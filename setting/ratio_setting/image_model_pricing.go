package ratio_setting

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/types"
)

const ImageModelPricingOptionKey = "ImageModelPricing"

type ImageModelPricingConfig struct {
	Models []ImageModelPricingItem `json:"models"`
}

type ImageModelGroupSelection struct {
	Group  string   `json:"group"`
	Models []string `json:"models"`
}

type ImageModelCandidate struct {
	Name  string
	Group string
	Model string
}

type ImageModelPricingItem struct {
	Name         string                     `json:"name"`
	Model        string                     `json:"model"`
	Models       []string                   `json:"models"`
	GroupModels  []ImageModelGroupSelection `json:"group_models"`
	BasePrice    float64                    `json:"base_price"`
	SizeRatios   map[string]float64         `json:"size_ratios"`
	Qualities    []string                   `json:"qualities"`
	AspectRatios []string                   `json:"aspect_ratios"`
	Counts       []int                      `json:"counts"`
}

var (
	imageModelPricingConfig = ImageModelPricingConfig{
		Models: []ImageModelPricingItem{},
	}
	imageSizePattern = regexp.MustCompile(`(?i)(\d+)\s*x\s*(\d+)`)
)

func defaultImageSizeRatios() map[string]float64 {
	return map[string]float64{
		"1K": 1,
		"2K": 2,
		"4K": 4,
	}
}

func normalizeImageModelPricingItem(item ImageModelPricingItem) ImageModelPricingItem {
	item.Model = strings.TrimSpace(item.Model)
	item.Name = strings.TrimSpace(item.Name)
	item.Models = normalizeStringList(item.Models)
	item.GroupModels = normalizeImageModelGroupSelections(item.GroupModels)
	if len(item.GroupModels) > 0 {
		flattened := make([]string, 0)
		for _, group := range item.GroupModels {
			flattened = append(flattened, group.Models...)
		}
		item.Models = normalizeStringList(append(item.Models, flattened...))
	}
	if item.Model != "" && len(item.Models) == 0 {
		item.Models = []string{item.Model}
	}
	if item.Model == "" && len(item.Models) > 0 {
		item.Model = item.Models[0]
	}
	if len(item.GroupModels) == 0 && len(item.Models) > 0 {
		item.GroupModels = []ImageModelGroupSelection{{Models: append([]string(nil), item.Models...)}}
	}
	if item.Name == "" {
		item.Name = item.Model
	}
	if item.BasePrice < 0 {
		item.BasePrice = 0
	}

	ratios := defaultImageSizeRatios()
	for key, value := range item.SizeRatios {
		normalizedKey := strings.ToUpper(strings.TrimSpace(key))
		if normalizedKey == "" || value <= 0 {
			continue
		}
		ratios[normalizedKey] = value
	}
	item.SizeRatios = ratios

	item.Qualities = normalizeStringList(item.Qualities)
	item.AspectRatios = normalizeStringList(item.AspectRatios)
	item.Counts = normalizePositiveIntList(item.Counts)
	return item
}

func normalizeImageModelGroupSelections(values []ImageModelGroupSelection) []ImageModelGroupSelection {
	result := make([]ImageModelGroupSelection, 0, len(values))
	seen := make(map[string]struct{})
	for _, value := range values {
		group := strings.TrimSpace(value.Group)
		models := normalizeStringList(value.Models)
		if len(models) == 0 {
			continue
		}
		filteredModels := make([]string, 0, len(models))
		for _, model := range models {
			key := group + "\x00" + model
			if _, ok := seen[key]; ok {
				continue
			}
			seen[key] = struct{}{}
			filteredModels = append(filteredModels, model)
		}
		if len(filteredModels) == 0 {
			continue
		}
		result = append(result, ImageModelGroupSelection{
			Group:  group,
			Models: filteredModels,
		})
	}
	return result
}

func normalizeStringList(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}
	return result
}

func normalizePositiveIntList(values []int) []int {
	result := make([]int, 0, len(values))
	seen := make(map[int]struct{}, len(values))
	for _, value := range values {
		if value <= 0 {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

func ImageModelPricing2JSONString() string {
	bytes, err := common.Marshal(imageModelPricingConfig)
	if err != nil {
		common.SysError("error marshalling image model pricing: " + err.Error())
		return `{"models":[]}`
	}
	return string(bytes)
}

func UpdateImageModelPricingByJSONString(jsonStr string) error {
	if strings.TrimSpace(jsonStr) == "" {
		imageModelPricingConfig = ImageModelPricingConfig{Models: []ImageModelPricingItem{}}
		InvalidateExposedDataCache()
		return nil
	}

	var next ImageModelPricingConfig
	if err := common.UnmarshalJsonStr(jsonStr, &next); err != nil {
		return err
	}

	seenModels := make(map[string]struct{}, len(next.Models))
	normalized := make([]ImageModelPricingItem, 0, len(next.Models))
	for _, item := range next.Models {
		item = normalizeImageModelPricingItem(item)
		key := item.Name
		if key == "" {
			key = item.Model
		}
		if key == "" {
			return fmt.Errorf("统一模型名称不能为空")
		}
		if _, ok := seenModels[key]; ok {
			return fmt.Errorf("模型 %s 重复", key)
		}
		seenModels[key] = struct{}{}
		normalized = append(normalized, item)
	}

	imageModelPricingConfig = ImageModelPricingConfig{Models: normalized}
	InvalidateExposedDataCache()

	// Debug: print candidates for gemini-3.1-flash-image
	if candidates := GetImageModelCandidates("gemini-3.1-flash-image"); len(candidates) > 0 {
		common.SysLog(fmt.Sprintf("Loaded %d candidate(s) for gemini-3.1-flash-image:", len(candidates)))
		for i, c := range candidates {
			common.SysLog(fmt.Sprintf("  [%d] Group=%s, Model=%s", i, c.Group, c.Model))
		}
	}

	return nil
}

func GetImageModelPricingCopy() ImageModelPricingConfig {
	models := make([]ImageModelPricingItem, 0, len(imageModelPricingConfig.Models))
	for _, item := range imageModelPricingConfig.Models {
		copyItem := item
		copyItem.SizeRatios = make(map[string]float64, len(item.SizeRatios))
		for key, value := range item.SizeRatios {
			copyItem.SizeRatios[key] = value
		}
		copyItem.Models = append([]string(nil), item.Models...)
		copyItem.GroupModels = make([]ImageModelGroupSelection, 0, len(item.GroupModels))
		for _, group := range item.GroupModels {
			copyItem.GroupModels = append(copyItem.GroupModels, ImageModelGroupSelection{
				Group:  group.Group,
				Models: append([]string(nil), group.Models...),
			})
		}
		copyItem.Qualities = append([]string(nil), item.Qualities...)
		copyItem.AspectRatios = append([]string(nil), item.AspectRatios...)
		copyItem.Counts = append([]int(nil), item.Counts...)
		models = append(models, copyItem)
	}
	return ImageModelPricingConfig{Models: models}
}

func getImageModelPricingItem(modelName string) (ImageModelPricingItem, bool) {
	modelName = FormatMatchingModelName(strings.TrimSpace(modelName))
	for _, item := range imageModelPricingConfig.Models {
		if FormatMatchingModelName(item.Name) == modelName {
			return item, true
		}
		if FormatMatchingModelName(item.Model) == modelName {
			return item, true
		}
		for _, model := range item.Models {
			if FormatMatchingModelName(model) == modelName {
				return item, true
			}
		}
		for _, group := range item.GroupModels {
			for _, model := range group.Models {
				if FormatMatchingModelName(model) == modelName {
					return item, true
				}
			}
		}
	}
	return ImageModelPricingItem{}, false
}

func GetImageModelPricingItem(modelName string) (ImageModelPricingItem, bool) {
	return getImageModelPricingItem(modelName)
}

func GetImageModelCandidates(modelName string) []ImageModelCandidate {
	item, ok := getImageModelPricingItem(modelName)
	if !ok {
		return nil
	}
	candidates := make([]ImageModelCandidate, 0)
	seen := make(map[string]struct{})
	add := func(group string, model string) {
		group = strings.TrimSpace(group)
		model = strings.TrimSpace(model)
		if model == "" {
			return
		}
		key := group + "\x00" + model
		if _, ok := seen[key]; ok {
			return
		}
		seen[key] = struct{}{}
		candidates = append(candidates, ImageModelCandidate{Name: item.Name, Group: group, Model: model})
	}
	for _, group := range item.GroupModels {
		for _, model := range group.Models {
			add(group.Group, model)
		}
	}
	if len(candidates) == 0 {
		for _, model := range item.Models {
			add("", model)
		}
	}
	if len(candidates) == 0 {
		add("", item.Model)
	}
	return candidates
}

func ImageSizeTier(size string) string {
	trimmed := strings.TrimSpace(size)
	if trimmed == "" || strings.EqualFold(trimmed, "auto") {
		return "1K"
	}
	upper := strings.ToUpper(trimmed)
	if upper == "1K" || upper == "2K" || upper == "4K" {
		return upper
	}
	matches := imageSizePattern.FindStringSubmatch(trimmed)
	if len(matches) != 3 {
		return "1K"
	}
	width, _ := strconv.Atoi(matches[1])
	height, _ := strconv.Atoi(matches[2])
	longSide := width
	if height > longSide {
		longSide = height
	}
	switch {
	case longSide >= 3000:
		return "4K"
	case longSide >= 1500:
		return "2K"
	default:
		return "1K"
	}
}

func GetImageModelSizeMultiplier(modelName string, size string) float64 {
	item, ok := getImageModelPricingItem(modelName)
	if !ok {
		return 1
	}
	tier := ImageSizeTier(size)
	ratio, ok := item.SizeRatios[tier]
	if !ok || ratio <= 0 {
		return 1
	}
	return ratio
}

func GetImageModelActualPrice(modelName string, size string) (float64, bool) {
	item, ok := getImageModelPricingItem(modelName)
	if !ok {
		return 0, false
	}
	return item.BasePrice * GetImageModelSizeMultiplier(modelName, size), true
}

func ApplyImageModelPricingMeta(modelName string, size string, meta *types.TokenCountMeta) {
	if meta == nil {
		return
	}
	multiplier := GetImageModelSizeMultiplier(modelName, size)
	if multiplier <= 0 || multiplier == 1 {
		return
	}
	if meta.ImagePriceRatio == 0 {
		meta.ImagePriceRatio = 1
	}
	meta.ImagePriceRatio *= multiplier
}
