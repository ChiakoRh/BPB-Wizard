package internal

import (
	"reflect"
	"testing"
)

func TestNodejsCompatFlags(t *testing.T) {
	tests := []struct {
		name              string
		compatibilityDate string
		expected          []string
	}{
		{
			name:              "compatibility date with nodejs compatibility enabled by default",
			compatibilityDate: "2026-10-22",
			expected:          nil,
		},
		{
			name:              "default on boundary date",
			compatibilityDate: "2026-08-04",
			expected:          nil,
		},
		{
			name:              "date before nodejs compatibility became the default",
			compatibilityDate: "2026-08-03",
			expected:          []string{"nodejs_compat"},
		},
		{
			name:              "much older date",
			compatibilityDate: "2024-09-23",
			expected:          []string{"nodejs_compat"},
		},
		{
			name:              "unparsable date keeps requesting nodejs compatibility",
			compatibilityDate: "not-a-date",
			expected:          []string{"nodejs_compat"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			flags := nodejsCompatFlags(test.compatibilityDate)

			if len(flags) != len(test.expected) || (len(flags) > 0 && !reflect.DeepEqual(flags, test.expected)) {
				t.Fatalf("nodejsCompatFlags(%q) = %v, want %v", test.compatibilityDate, flags, test.expected)
			}
		})
	}
}
