# Sales Dashboard Schema

Generated at: 2026-09-03 17:45
Source URL: https://sales-dashboard-13g.pages.dev/dashboard/

This document intentionally records CONFIRMED, INFERRED, and UNKNOWN separately. INFERRED and UNKNOWN fields must not be used for production mapping unless the dashboard source usage is later confirmed.

## Runtime Globals

| Global | typeof | total key count | WA key count | WA2602CD52 | WA sample keys |
| --- | ---: | ---: | ---: | --- | --- |
| PMETA | object | 5172 | 1128 | yes | WA2200HZ12, WA2200KT01, WA2200KT11, WA2200LT06, WA2200LT07, WA2200LT16, WA2200PT02, WA2200SH11 |
| PDET | object | 5172 | 1128 | yes | WA2200HZ12, WA2200KT01, WA2200KT11, WA2200LT06, WA2200LT07, WA2200LT16, WA2200PT02, WA2200SH11 |
| PDPER | object | 44 | 0 | no |  |
| ORD | object | 3 | 1 | no | WA |
| ATOM | object | 3 | 0 | no |  |
| IMG | object | 4729 | 956 | yes | WA2200KT01, WA2200LT06, WA2202KT12, WA2203OP51, WA2300KT01, WA2300SH01, WA2300SS01, WA2302KT05 |

## Compact Runtime Object Inspect

### PDPER

```json
{
  "keys": [
    "26-01W1",
    "26-01W2",
    "26-01W3",
    "26-01W4",
    "26-01W5",
    "26-02W1",
    "26-02W2",
    "26-02W3",
    "26-02W4",
    "26-03W1",
    "26-03W2",
    "26-03W3",
    "26-03W4",
    "26-04W1",
    "26-04W2",
    "26-04W3",
    "26-04W4",
    "26-04W5",
    "26-05W1",
    "26-05W2",
    "26-05W3",
    "26-05W4",
    "26-06W1",
    "26-06W2",
    "26-06W3",
    "26-06W4",
    "26-07W1",
    "26-07W2",
    "26-07W3",
    "26-07W4",
    "26-07W5",
    "26-08W1",
    "26-08W2",
    "26-08W3",
    "26-08W4",
    "26-09W1",
    "26-01M",
    "26-02M",
    "26-03M",
    "26-04M",
    "26-05M",
    "26-06M",
    "26-07M",
    "26-08M"
  ],
  "year26Keys": [
    "26-01W1",
    "26-01W2",
    "26-01W3",
    "26-01W4",
    "26-01W5",
    "26-02W1",
    "26-02W2",
    "26-02W3",
    "26-02W4",
    "26-03W1",
    "26-03W2",
    "26-03W3",
    "26-03W4",
    "26-04W1",
    "26-04W2",
    "26-04W3",
    "26-04W4",
    "26-04W5",
    "26-05W1",
    "26-05W2",
    "26-05W3",
    "26-05W4",
    "26-06W1",
    "26-06W2",
    "26-06W3",
    "26-06W4",
    "26-07W1",
    "26-07W2",
    "26-07W3",
    "26-07W4",
    "26-07W5",
    "26-08W1",
    "26-08W2",
    "26-08W3",
    "26-08W4",
    "26-09W1",
    "26-01M",
    "26-02M",
    "26-03M",
    "26-04M",
    "26-05M",
    "26-06M",
    "26-07M",
    "26-08M"
  ],
  "augustCandidateKeys": [
    "26-08W1",
    "26-08W2",
    "26-08W3",
    "26-08W4"
  ],
  "lastKeys": [
    "26-03M",
    "26-04M",
    "26-05M",
    "26-06M",
    "26-07M",
    "26-08M"
  ],
  "valueTypesByFirstKeys": {
    "26-01W1": "object",
    "26-01W2": "object",
    "26-01W3": "object"
  },
  "firstThreeShapes": {
    "26-01W1": {
      "type": "object",
      "keyCount": 2,
      "sampleKeys": [
        "cur",
        "prev"
      ],
      "childTypes": {
        "cur": "object",
        "prev": "object"
      },
      "sampleChildren": {
        "cur": {
          "type": "object",
          "keyCount": 2448,
          "sampleKeys": [
            "CO2502STE1",
            "CO2401HD02",
            "CO2503HD70",
            "CO2403HZ01",
            "CO2404DP20",
            "CO2403CR10"
          ],
          "childTypes": {
            "CO2502STE1": "object",
            "CO2401HD02": "object",
            "CO2503HD70": "object",
            "CO2403HZ01": "object",
            "CO2404DP20": "object",
            "CO2403CR10": "object"
          },
          "sampleChildren": {
            "CO2502STE1": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "무신사",
                "직영점",
                "백화점",
                "외부몰",
                "대리점",
                "쇼핑몰"
              ],
              "childTypes": {
                "무신사": "array",
                "직영점": "array",
                "백화점": "array",
                "외부몰": "array",
                "대리점": "array",
                "쇼핑몰": "array"
              }
            },
            "CO2401HD02": {
              "type": "object",
              "keyCount": 4,
              "sampleKeys": [
                "무신사",
                "자사몰",
                "해외 위탁",
                "아울렛"
              ],
              "childTypes": {
                "무신사": "array",
                "자사몰": "array",
                "해외 위탁": "array",
                "아울렛": "array"
              }
            },
            "CO2503HD70": {
              "type": "object",
              "keyCount": 9,
              "sampleKeys": [
                "아울렛",
                "직영점",
                "백화점",
                "위탁사",
                "무신사",
                "면세점"
              ],
              "childTypes": {
                "아울렛": "array",
                "직영점": "array",
                "백화점": "array",
                "위탁사": "array",
                "무신사": "array",
                "면세점": "array"
              }
            },
            "CO2403HZ01": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "아울렛",
                "외부몰",
                "쇼핑몰",
                "자사몰",
                "백화점"
              ],
              "childTypes": {
                "아울렛": "array",
                "외부몰": "array",
                "쇼핑몰": "array",
                "자사몰": "array",
                "백화점": "array"
              }
            },
            "CO2404DP20": {
              "type": "object",
              "keyCount": 4,
              "sampleKeys": [
                "백화점",
                "아울렛",
                "무신사",
                "쇼핑몰"
              ],
              "childTypes": {
                "백화점": "array",
                "아울렛": "array",
                "무신사": "array",
                "쇼핑몰": "array"
              }
            },
            "CO2403CR10": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "백화점",
                "쇼핑몰",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "외부몰": "array"
              }
            }
          }
        },
        "prev": {
          "type": "object",
          "keyCount": 1689,
          "sampleKeys": [
            "CO2403LT01",
            "CO2403KT17",
            "CO2402SS01",
            "CO2403CR01",
            "CO2403CR02",
            "CO2403PT22"
          ],
          "childTypes": {
            "CO2403LT01": "object",
            "CO2403KT17": "object",
            "CO2402SS01": "object",
            "CO2403CR01": "object",
            "CO2403CR02": "object",
            "CO2403PT22": "object"
          },
          "sampleChildren": {
            "CO2403LT01": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "백화점",
                "쇼핑몰",
                "자사몰",
                "대리점",
                "아울렛"
              ],
              "childTypes": {
                "백화점": "array",
                "쇼핑몰": "array",
                "자사몰": "array",
                "대리점": "array",
                "아울렛": "array"
              }
            },
            "CO2403KT17": {
              "type": "object",
              "keyCount": 8,
              "sampleKeys": [
                "백화점",
                "직영점",
                "무신사",
                "대리점",
                "쇼핑몰",
                "외부몰"
              ],
              "childTypes": {
                "백화점": "array",
                "직영점": "array",
                "무신사": "array",
                "대리점": "array",
                "쇼핑몰": "array",
                "외부몰": "array"
              }
            },
            "CO2402SS01": {
              "type": "object",
              "keyCount": 4,
              "sampleKeys": [
                "무신사",
                "백화점",
                "위탁사",
                "자사몰"
              ],
              "childTypes": {
                "무신사": "array",
                "백화점": "array",
                "위탁사": "array",
                "자사몰": "array"
              }
            },
            "CO2403CR01": {
              "type": "object",
              "keyCount": 12,
              "sampleKeys": [
                "위탁사",
                "대리점",
                "쇼핑몰",
                "백화점",
                "아울렛",
                "무신사"
              ],
              "childTypes": {
                "위탁사": "array",
                "대리점": "array",
                "쇼핑몰": "array",
                "백화점": "array",
                "아울렛": "array",
                "무신사": "array"
              }
            },
            "CO2403CR02": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "쇼핑몰",
                "아울렛",
                "백화점",
                "자사몰",
                "직영점",
                "외부몰"
              ],
              "childTypes": {
                "쇼핑몰": "array",
                "아울렛": "array",
                "백화점": "array",
                "자사몰": "array",
                "직영점": "array",
                "외부몰": "array"
              }
            },
            "CO2403PT22": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "백화점",
                "쇼핑몰",
                "아울렛",
                "대리점",
                "면세점",
                "자사몰"
              ],
              "childTypes": {
                "백화점": "array",
                "쇼핑몰": "array",
                "아울렛": "array",
                "대리점": "array",
                "면세점": "array",
                "자사몰": "array"
              }
            }
          }
        }
      }
    },
    "26-01W2": {
      "type": "object",
      "keyCount": 2,
      "sampleKeys": [
        "cur",
        "prev"
      ],
      "childTypes": {
        "cur": "object",
        "prev": "object"
      },
      "sampleChildren": {
        "cur": {
          "type": "object",
          "keyCount": 2612,
          "sampleKeys": [
            "CO2506CA02",
            "CO2502SO59",
            "CO2502SS04",
            "CO2507BP75",
            "CO2502ST32",
            "CO2606CA05"
          ],
          "childTypes": {
            "CO2506CA02": "object",
            "CO2502SO59": "object",
            "CO2502SS04": "object",
            "CO2507BP75": "object",
            "CO2502ST32": "object",
            "CO2606CA05": "object"
          },
          "sampleChildren": {
            "CO2506CA02": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "직영점",
                "아울렛",
                "무신사",
                "대리점",
                "외부몰",
                "백화점"
              ],
              "childTypes": {
                "직영점": "array",
                "아울렛": "array",
                "무신사": "array",
                "대리점": "array",
                "외부몰": "array",
                "백화점": "array"
              }
            },
            "CO2502SO59": {
              "type": "object",
              "keyCount": 2,
              "sampleKeys": [
                "무신사",
                "해외 위탁"
              ],
              "childTypes": {
                "무신사": "array",
                "해외 위탁": "array"
              }
            },
            "CO2502SS04": {
              "type": "object",
              "keyCount": 1,
              "sampleKeys": [
                "외부몰"
              ],
              "childTypes": {
                "외부몰": "array"
              }
            },
            "CO2507BP75": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "쇼핑몰",
                "아울렛",
                "백화점",
                "면세점",
                "직영점"
              ],
              "childTypes": {
                "쇼핑몰": "array",
                "아울렛": "array",
                "백화점": "array",
                "면세점": "array",
                "직영점": "array"
              }
            },
            "CO2502ST32": {
              "type": "object",
              "keyCount": 2,
              "sampleKeys": [
                "무신사",
                "면세점"
              ],
              "childTypes": {
                "무신사": "array",
                "면세점": "array"
              }
            },
            "CO2606CA05": {
              "type": "object",
              "keyCount": 8,
              "sampleKeys": [
                "백화점",
                "쇼핑몰",
                "무신사",
                "아울렛",
                "자사몰",
                "직영점"
              ],
              "childTypes": {
                "백화점": "array",
                "쇼핑몰": "array",
                "무신사": "array",
                "아울렛": "array",
                "자사몰": "array",
                "직영점": "array"
              }
            }
          }
        },
        "prev": {
          "type": "object",
          "keyCount": 1785,
          "sampleKeys": [
            "CO2502STE1",
            "CO2401HD02",
            "CO2403HZ01",
            "CO2404DP20",
            "CO2403CR10",
            "CO2506TC72"
          ],
          "childTypes": {
            "CO2502STE1": "object",
            "CO2401HD02": "object",
            "CO2403HZ01": "object",
            "CO2404DP20": "object",
            "CO2403CR10": "object",
            "CO2506TC72": "object"
          },
          "sampleChildren": {
            "CO2502STE1": {
              "type": "object",
              "keyCount": 2,
              "sampleKeys": [
                "아울렛",
                "해외 사입"
              ],
              "childTypes": {
                "아울렛": "array",
                "해외 사입": "array"
              }
            },
            "CO2401HD02": {
              "type": "object",
              "keyCount": 3,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "외부몰": "array"
              }
            },
            "CO2403HZ01": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "외부몰",
                "무신사",
                "쇼핑몰",
                "위탁사"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "외부몰": "array",
                "무신사": "array",
                "쇼핑몰": "array",
                "위탁사": "array"
              }
            },
            "CO2404DP20": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "쇼핑몰",
                "대리점",
                "자사몰",
                "백화점",
                "아울렛",
                "외부몰"
              ],
              "childTypes": {
                "쇼핑몰": "array",
                "대리점": "array",
                "자사몰": "array",
                "백화점": "array",
                "아울렛": "array",
                "외부몰": "array"
              }
            },
            "CO2403CR10": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "백화점",
                "대리점",
                "쇼핑몰",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "백화점": "array",
                "대리점": "array",
                "쇼핑몰": "array",
                "외부몰": "array"
              }
            },
            "CO2506TC72": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "백화점",
                "직영점",
                "면세점",
                "외부몰",
                "대리점"
              ],
              "childTypes": {
                "백화점": "array",
                "직영점": "array",
                "면세점": "array",
                "외부몰": "array",
                "대리점": "array"
              }
            }
          }
        }
      }
    },
    "26-01W3": {
      "type": "object",
      "keyCount": 2,
      "sampleKeys": [
        "cur",
        "prev"
      ],
      "childTypes": {
        "cur": "object",
        "prev": "object"
      },
      "sampleChildren": {
        "cur": {
          "type": "object",
          "keyCount": 2903,
          "sampleKeys": [
            "CO2506CA02",
            "CO2502SO59",
            "CO2502SS04",
            "CO2507BP75",
            "CO2502ST32",
            "CO2606CA05"
          ],
          "childTypes": {
            "CO2506CA02": "object",
            "CO2502SO59": "object",
            "CO2502SS04": "object",
            "CO2507BP75": "object",
            "CO2502ST32": "object",
            "CO2606CA05": "object"
          },
          "sampleChildren": {
            "CO2506CA02": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "직영점",
                "아울렛",
                "무신사",
                "대리점",
                "외부몰",
                "백화점"
              ],
              "childTypes": {
                "직영점": "array",
                "아울렛": "array",
                "무신사": "array",
                "대리점": "array",
                "외부몰": "array",
                "백화점": "array"
              }
            },
            "CO2502SO59": {
              "type": "object",
              "keyCount": 2,
              "sampleKeys": [
                "무신사",
                "해외 위탁"
              ],
              "childTypes": {
                "무신사": "array",
                "해외 위탁": "array"
              }
            },
            "CO2502SS04": {
              "type": "object",
              "keyCount": 1,
              "sampleKeys": [
                "외부몰"
              ],
              "childTypes": {
                "외부몰": "array"
              }
            },
            "CO2507BP75": {
              "type": "object",
              "keyCount": 6,
              "sampleKeys": [
                "쇼핑몰",
                "아울렛",
                "백화점",
                "외부몰",
                "면세점",
                "직영점"
              ],
              "childTypes": {
                "쇼핑몰": "array",
                "아울렛": "array",
                "백화점": "array",
                "외부몰": "array",
                "면세점": "array",
                "직영점": "array"
              }
            },
            "CO2502ST32": {
              "type": "object",
              "keyCount": 2,
              "sampleKeys": [
                "무신사",
                "면세점"
              ],
              "childTypes": {
                "무신사": "array",
                "면세점": "array"
              }
            },
            "CO2606CA05": {
              "type": "object",
              "keyCount": 9,
              "sampleKeys": [
                "백화점",
                "쇼핑몰",
                "무신사",
                "아울렛",
                "자사몰",
                "직영점"
              ],
              "childTypes": {
                "백화점": "array",
                "쇼핑몰": "array",
                "무신사": "array",
                "아울렛": "array",
                "자사몰": "array",
                "직영점": "array"
              }
            }
          }
        },
        "prev": {
          "type": "object",
          "keyCount": 1991,
          "sampleKeys": [
            "CO2502STE1",
            "CO2401HD02",
            "CO2403HZ01",
            "CO2404DP20",
            "CO2403CR10",
            "CO2506TC72"
          ],
          "childTypes": {
            "CO2502STE1": "object",
            "CO2401HD02": "object",
            "CO2403HZ01": "object",
            "CO2404DP20": "object",
            "CO2403CR10": "object",
            "CO2506TC72": "object"
          },
          "sampleChildren": {
            "CO2502STE1": {
              "type": "object",
              "keyCount": 3,
              "sampleKeys": [
                "쇼핑몰",
                "아울렛",
                "해외 사입"
              ],
              "childTypes": {
                "쇼핑몰": "array",
                "아울렛": "array",
                "해외 사입": "array"
              }
            },
            "CO2401HD02": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "외부몰",
                "자사몰",
                "해외 위탁"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "외부몰": "array",
                "자사몰": "array",
                "해외 위탁": "array"
              }
            },
            "CO2403HZ01": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "외부몰",
                "무신사",
                "쇼핑몰",
                "위탁사"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "외부몰": "array",
                "무신사": "array",
                "쇼핑몰": "array",
                "위탁사": "array"
              }
            },
            "CO2404DP20": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "쇼핑몰",
                "대리점",
                "자사몰",
                "백화점",
                "아울렛",
                "외부몰"
              ],
              "childTypes": {
                "쇼핑몰": "array",
                "대리점": "array",
                "자사몰": "array",
                "백화점": "array",
                "아울렛": "array",
                "외부몰": "array"
              }
            },
            "CO2403CR10": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "백화점",
                "대리점",
                "쇼핑몰",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "백화점": "array",
                "대리점": "array",
                "쇼핑몰": "array",
                "외부몰": "array"
              }
            },
            "CO2506TC72": {
              "type": "object",
              "keyCount": 7,
              "sampleKeys": [
                "백화점",
                "직영점",
                "면세점",
                "아울렛",
                "외부몰",
                "쇼핑몰"
              ],
              "childTypes": {
                "백화점": "array",
                "직영점": "array",
                "면세점": "array",
                "아울렛": "array",
                "외부몰": "array",
                "쇼핑몰": "array"
              }
            }
          }
        }
      }
    }
  },
  "lastKeyShapes": {
    "26-03M": {
      "type": "object",
      "keyCount": 2,
      "sampleKeys": [
        "cur",
        "prev"
      ],
      "childTypes": {
        "cur": "object",
        "prev": "object"
      },
      "sampleChildren": {
        "cur": {
          "type": "object",
          "keyCount": 3938,
          "sampleKeys": [
            "CO2602ST05",
            "CO2602ST01",
            "CO2506CA02",
            "CO2502SO59",
            "CO2502SS04",
            "CO2602KT75"
          ],
          "childTypes": {
            "CO2602ST05": "object",
            "CO2602ST01": "object",
            "CO2506CA02": "object",
            "CO2502SO59": "object",
            "CO2502SS04": "object",
            "CO2602KT75": "object"
          },
          "sampleChildren": {
            "CO2602ST05": {
              "type": "object",
              "keyCount": 12,
              "sampleKeys": [
                "백화점",
                "아울렛",
                "쇼핑몰",
                "면세점",
                "직영점",
                "외부몰"
              ],
              "childTypes": {
                "백화점": "array",
                "아울렛": "array",
                "쇼핑몰": "array",
                "면세점": "array",
                "직영점": "array",
                "외부몰": "array"
              }
            },
            "CO2602ST01": {
              "type": "object",
              "keyCount": 13,
              "sampleKeys": [
                "위탁사",
                "백화점",
                "쇼핑몰",
                "직영점",
                "외부몰",
                "아울렛"
              ],
              "childTypes": {
                "위탁사": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "외부몰": "array",
                "아울렛": "array"
              }
            },
            "CO2506CA02": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "직영점",
                "아울렛",
                "무신사",
                "대리점",
                "외부몰",
                "백화점"
              ],
              "childTypes": {
                "직영점": "array",
                "아울렛": "array",
                "무신사": "array",
                "대리점": "array",
                "외부몰": "array",
                "백화점": "array"
              }
            },
            "CO2502SO59": {
              "type": "object",
              "keyCount": 3,
              "sampleKeys": [
                "자사몰",
                "외부몰",
                "해외 위탁"
              ],
              "childTypes": {
                "자사몰": "array",
                "외부몰": "array",
                "해외 위탁": "array"
              }
            },
            "CO2502SS04": {
              "type": "object",
              "keyCount": 3,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "해외 위탁"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "해외 위탁": "array"
              }
            },
            "CO2602KT75": {
              "type": "object",
              "keyCount": 9,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "직영점",
                "대리점",
                "자사몰",
                "해외 위탁"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "직영점": "array",
                "대리점": "array",
                "자사몰": "array",
                "해외 위탁": "array"
              }
            }
          }
        },
        "prev": {
          "type": "object",
          "keyCount": 2890,
          "sampleKeys": [
            "CO2502STE1",
            "CO2401HD02",
            "CO2403HZ01",
            "CO2404DP20",
            "CO2403CR10",
            "CO2506TC72"
          ],
          "childTypes": {
            "CO2502STE1": "object",
            "CO2401HD02": "object",
            "CO2403HZ01": "object",
            "CO2404DP20": "object",
            "CO2403CR10": "object",
            "CO2506TC72": "object"
          },
          "sampleChildren": {
            "CO2502STE1": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "무신사",
                "직영점",
                "백화점",
                "외부몰",
                "대리점",
                "쇼핑몰"
              ],
              "childTypes": {
                "무신사": "array",
                "직영점": "array",
                "백화점": "array",
                "외부몰": "array",
                "대리점": "array",
                "쇼핑몰": "array"
              }
            },
            "CO2401HD02": {
              "type": "object",
              "keyCount": 3,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "외부몰": "array"
              }
            },
            "CO2403HZ01": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "외부몰",
                "무신사",
                "쇼핑몰",
                "위탁사"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "외부몰": "array",
                "무신사": "array",
                "쇼핑몰": "array",
                "위탁사": "array"
              }
            },
            "CO2404DP20": {
              "type": "object",
              "keyCount": 9,
              "sampleKeys": [
                "쇼핑몰",
                "대리점",
                "자사몰",
                "백화점",
                "아울렛",
                "외부몰"
              ],
              "childTypes": {
                "쇼핑몰": "array",
                "대리점": "array",
                "자사몰": "array",
                "백화점": "array",
                "아울렛": "array",
                "외부몰": "array"
              }
            },
            "CO2403CR10": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "백화점",
                "대리점",
                "쇼핑몰",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "백화점": "array",
                "대리점": "array",
                "쇼핑몰": "array",
                "외부몰": "array"
              }
            },
            "CO2506TC72": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "백화점",
                "직영점",
                "면세점",
                "아울렛",
                "외부몰",
                "자사몰"
              ],
              "childTypes": {
                "백화점": "array",
                "직영점": "array",
                "면세점": "array",
                "아울렛": "array",
                "외부몰": "array",
                "자사몰": "array"
              }
            }
          }
        }
      }
    },
    "26-04M": {
      "type": "object",
      "keyCount": 2,
      "sampleKeys": [
        "cur",
        "prev"
      ],
      "childTypes": {
        "cur": "object",
        "prev": "object"
      },
      "sampleChildren": {
        "cur": {
          "type": "object",
          "keyCount": 3770,
          "sampleKeys": [
            "CO2602SO35",
            "CO2402KT71",
            "CO2602ST05",
            "CO2602ST01",
            "CO2506CA02",
            "CO2502SO59"
          ],
          "childTypes": {
            "CO2602SO35": "object",
            "CO2402KT71": "object",
            "CO2602ST05": "object",
            "CO2602ST01": "object",
            "CO2506CA02": "object",
            "CO2502SO59": "object"
          },
          "sampleChildren": {
            "CO2602SO35": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "쇼핑몰",
                "직영점",
                "대리점"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "대리점": "array"
              }
            },
            "CO2402KT71": {
              "type": "object",
              "keyCount": 3,
              "sampleKeys": [
                "위탁사",
                "자사몰",
                "직영점"
              ],
              "childTypes": {
                "위탁사": "array",
                "자사몰": "array",
                "직영점": "array"
              }
            },
            "CO2602ST05": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "백화점",
                "아울렛",
                "쇼핑몰",
                "면세점",
                "직영점",
                "외부몰"
              ],
              "childTypes": {
                "백화점": "array",
                "아울렛": "array",
                "쇼핑몰": "array",
                "면세점": "array",
                "직영점": "array",
                "외부몰": "array"
              }
            },
            "CO2602ST01": {
              "type": "object",
              "keyCount": 12,
              "sampleKeys": [
                "위탁사",
                "백화점",
                "쇼핑몰",
                "직영점",
                "외부몰",
                "아울렛"
              ],
              "childTypes": {
                "위탁사": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "외부몰": "array",
                "아울렛": "array"
              }
            },
            "CO2506CA02": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "직영점",
                "아울렛",
                "무신사",
                "대리점",
                "외부몰",
                "백화점"
              ],
              "childTypes": {
                "직영점": "array",
                "아울렛": "array",
                "무신사": "array",
                "대리점": "array",
                "외부몰": "array",
                "백화점": "array"
              }
            },
            "CO2502SO59": {
              "type": "object",
              "keyCount": 6,
              "sampleKeys": [
                "백화점",
                "아울렛",
                "쇼핑몰",
                "자사몰",
                "대리점",
                "무신사"
              ],
              "childTypes": {
                "백화점": "array",
                "아울렛": "array",
                "쇼핑몰": "array",
                "자사몰": "array",
                "대리점": "array",
                "무신사": "array"
              }
            }
          }
        },
        "prev": {
          "type": "object",
          "keyCount": 2981,
          "sampleKeys": [
            "CO2502STE1",
            "CO2401HD02",
            "CO2403HZ01",
            "CO2404DP20",
            "CO2403CR10",
            "CO2506TC72"
          ],
          "childTypes": {
            "CO2502STE1": "object",
            "CO2401HD02": "object",
            "CO2403HZ01": "object",
            "CO2404DP20": "object",
            "CO2403CR10": "object",
            "CO2506TC72": "object"
          },
          "sampleChildren": {
            "CO2502STE1": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "무신사",
                "직영점",
                "백화점",
                "외부몰",
                "대리점",
                "쇼핑몰"
              ],
              "childTypes": {
                "무신사": "array",
                "직영점": "array",
                "백화점": "array",
                "외부몰": "array",
                "대리점": "array",
                "쇼핑몰": "array"
              }
            },
            "CO2401HD02": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "무신사",
                "외부몰",
                "자사몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "무신사": "array",
                "외부몰": "array",
                "자사몰": "array"
              }
            },
            "CO2403HZ01": {
              "type": "object",
              "keyCount": 8,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "외부몰",
                "무신사",
                "쇼핑몰",
                "해외 위탁"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "외부몰": "array",
                "무신사": "array",
                "쇼핑몰": "array",
                "해외 위탁": "array"
              }
            },
            "CO2404DP20": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "백화점",
                "아울렛",
                "외부몰",
                "무신사",
                "면세점"
              ],
              "childTypes": {
                "백화점": "array",
                "아울렛": "array",
                "외부몰": "array",
                "무신사": "array",
                "면세점": "array"
              }
            },
            "CO2403CR10": {
              "type": "object",
              "keyCount": 8,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "백화점",
                "외부몰",
                "자사몰",
                "위탁사"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "백화점": "array",
                "외부몰": "array",
                "자사몰": "array",
                "위탁사": "array"
              }
            },
            "CO2506TC72": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "백화점",
                "직영점",
                "면세점",
                "아울렛",
                "외부몰",
                "쇼핑몰"
              ],
              "childTypes": {
                "백화점": "array",
                "직영점": "array",
                "면세점": "array",
                "아울렛": "array",
                "외부몰": "array",
                "쇼핑몰": "array"
              }
            }
          }
        }
      }
    },
    "26-05M": {
      "type": "object",
      "keyCount": 2,
      "sampleKeys": [
        "cur",
        "prev"
      ],
      "childTypes": {
        "cur": "object",
        "prev": "object"
      },
      "sampleChildren": {
        "cur": {
          "type": "object",
          "keyCount": 3486,
          "sampleKeys": [
            "CO2606SE05",
            "CO2602SO35",
            "CO2402KT71",
            "CO2602ST05",
            "CO2602ST01",
            "CO2506CA02"
          ],
          "childTypes": {
            "CO2606SE05": "object",
            "CO2602SO35": "object",
            "CO2402KT71": "object",
            "CO2602ST05": "object",
            "CO2602ST01": "object",
            "CO2506CA02": "object"
          },
          "sampleChildren": {
            "CO2606SE05": {
              "type": "object",
              "keyCount": 7,
              "sampleKeys": [
                "백화점",
                "쇼핑몰",
                "아울렛",
                "직영점",
                "무신사",
                "대리점"
              ],
              "childTypes": {
                "백화점": "array",
                "쇼핑몰": "array",
                "아울렛": "array",
                "직영점": "array",
                "무신사": "array",
                "대리점": "array"
              }
            },
            "CO2602SO35": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "쇼핑몰",
                "직영점",
                "무신사",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "무신사": "array",
                "외부몰": "array"
              }
            },
            "CO2402KT71": {
              "type": "object",
              "keyCount": 4,
              "sampleKeys": [
                "위탁사",
                "아울렛",
                "무신사",
                "해외 위탁"
              ],
              "childTypes": {
                "위탁사": "array",
                "아울렛": "array",
                "무신사": "array",
                "해외 위탁": "array"
              }
            },
            "CO2602ST05": {
              "type": "object",
              "keyCount": 12,
              "sampleKeys": [
                "백화점",
                "아울렛",
                "쇼핑몰",
                "면세점",
                "직영점",
                "외부몰"
              ],
              "childTypes": {
                "백화점": "array",
                "아울렛": "array",
                "쇼핑몰": "array",
                "면세점": "array",
                "직영점": "array",
                "외부몰": "array"
              }
            },
            "CO2602ST01": {
              "type": "object",
              "keyCount": 12,
              "sampleKeys": [
                "위탁사",
                "백화점",
                "쇼핑몰",
                "직영점",
                "외부몰",
                "아울렛"
              ],
              "childTypes": {
                "위탁사": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "외부몰": "array",
                "아울렛": "array"
              }
            },
            "CO2506CA02": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "직영점",
                "아울렛",
                "무신사",
                "대리점",
                "외부몰",
                "백화점"
              ],
              "childTypes": {
                "직영점": "array",
                "아울렛": "array",
                "무신사": "array",
                "대리점": "array",
                "외부몰": "array",
                "백화점": "array"
              }
            }
          }
        },
        "prev": {
          "type": "object",
          "keyCount": 2791,
          "sampleKeys": [
            "CO2502STE1",
            "CO2401HD02",
            "CO2403HZ01",
            "CO2404DP20",
            "CO2403CR10",
            "CO2506TC72"
          ],
          "childTypes": {
            "CO2502STE1": "object",
            "CO2401HD02": "object",
            "CO2403HZ01": "object",
            "CO2404DP20": "object",
            "CO2403CR10": "object",
            "CO2506TC72": "object"
          },
          "sampleChildren": {
            "CO2502STE1": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "무신사",
                "직영점",
                "백화점",
                "외부몰",
                "대리점",
                "쇼핑몰"
              ],
              "childTypes": {
                "무신사": "array",
                "직영점": "array",
                "백화점": "array",
                "외부몰": "array",
                "대리점": "array",
                "쇼핑몰": "array"
              }
            },
            "CO2401HD02": {
              "type": "object",
              "keyCount": 2,
              "sampleKeys": [
                "백화점",
                "무신사"
              ],
              "childTypes": {
                "백화점": "array",
                "무신사": "array"
              }
            },
            "CO2403HZ01": {
              "type": "object",
              "keyCount": 8,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "외부몰",
                "무신사",
                "쇼핑몰",
                "해외 위탁"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "외부몰": "array",
                "무신사": "array",
                "쇼핑몰": "array",
                "해외 위탁": "array"
              }
            },
            "CO2404DP20": {
              "type": "object",
              "keyCount": 2,
              "sampleKeys": [
                "외부몰",
                "무신사"
              ],
              "childTypes": {
                "외부몰": "array",
                "무신사": "array"
              }
            },
            "CO2403CR10": {
              "type": "object",
              "keyCount": 6,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "백화점",
                "외부몰",
                "자사몰",
                "면세점"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "백화점": "array",
                "외부몰": "array",
                "자사몰": "array",
                "면세점": "array"
              }
            },
            "CO2506TC72": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "백화점",
                "직영점",
                "면세점",
                "아울렛",
                "외부몰",
                "자사몰"
              ],
              "childTypes": {
                "백화점": "array",
                "직영점": "array",
                "면세점": "array",
                "아울렛": "array",
                "외부몰": "array",
                "자사몰": "array"
              }
            }
          }
        }
      }
    },
    "26-06M": {
      "type": "object",
      "keyCount": 2,
      "sampleKeys": [
        "cur",
        "prev"
      ],
      "childTypes": {
        "cur": "object",
        "prev": "object"
      },
      "sampleChildren": {
        "cur": {
          "type": "object",
          "keyCount": 3485,
          "sampleKeys": [
            "CO2606SE05",
            "CO2602SO35",
            "CO2402KT71",
            "CO2602ST05",
            "CO2602ST01",
            "CO2506CA02"
          ],
          "childTypes": {
            "CO2606SE05": "object",
            "CO2602SO35": "object",
            "CO2402KT71": "object",
            "CO2602ST05": "object",
            "CO2602ST01": "object",
            "CO2506CA02": "object"
          },
          "sampleChildren": {
            "CO2606SE05": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "백화점",
                "쇼핑몰",
                "아울렛",
                "직영점",
                "해외 위탁",
                "면세점"
              ],
              "childTypes": {
                "백화점": "array",
                "쇼핑몰": "array",
                "아울렛": "array",
                "직영점": "array",
                "해외 위탁": "array",
                "면세점": "array"
              }
            },
            "CO2602SO35": {
              "type": "object",
              "keyCount": 9,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "쇼핑몰",
                "직영점",
                "무신사",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "무신사": "array",
                "외부몰": "array"
              }
            },
            "CO2402KT71": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "위탁사",
                "외부몰",
                "백화점",
                "무신사",
                "해외 위탁"
              ],
              "childTypes": {
                "위탁사": "array",
                "외부몰": "array",
                "백화점": "array",
                "무신사": "array",
                "해외 위탁": "array"
              }
            },
            "CO2602ST05": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "백화점",
                "아울렛",
                "쇼핑몰",
                "면세점",
                "직영점",
                "외부몰"
              ],
              "childTypes": {
                "백화점": "array",
                "아울렛": "array",
                "쇼핑몰": "array",
                "면세점": "array",
                "직영점": "array",
                "외부몰": "array"
              }
            },
            "CO2602ST01": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "위탁사",
                "백화점",
                "쇼핑몰",
                "직영점",
                "외부몰",
                "아울렛"
              ],
              "childTypes": {
                "위탁사": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "외부몰": "array",
                "아울렛": "array"
              }
            },
            "CO2506CA02": {
              "type": "object",
              "keyCount": 12,
              "sampleKeys": [
                "직영점",
                "아울렛",
                "무신사",
                "대리점",
                "외부몰",
                "백화점"
              ],
              "childTypes": {
                "직영점": "array",
                "아울렛": "array",
                "무신사": "array",
                "대리점": "array",
                "외부몰": "array",
                "백화점": "array"
              }
            }
          }
        },
        "prev": {
          "type": "object",
          "keyCount": 2835,
          "sampleKeys": [
            "CO2502STE1",
            "CO2401HD02",
            "CO2403HZ01",
            "CO2404DP20",
            "CO2403CR10",
            "CO2506TC72"
          ],
          "childTypes": {
            "CO2502STE1": "object",
            "CO2401HD02": "object",
            "CO2403HZ01": "object",
            "CO2404DP20": "object",
            "CO2403CR10": "object",
            "CO2506TC72": "object"
          },
          "sampleChildren": {
            "CO2502STE1": {
              "type": "object",
              "keyCount": 12,
              "sampleKeys": [
                "무신사",
                "직영점",
                "백화점",
                "외부몰",
                "대리점",
                "쇼핑몰"
              ],
              "childTypes": {
                "무신사": "array",
                "직영점": "array",
                "백화점": "array",
                "외부몰": "array",
                "대리점": "array",
                "쇼핑몰": "array"
              }
            },
            "CO2401HD02": {
              "type": "object",
              "keyCount": 3,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "외부몰": "array"
              }
            },
            "CO2403HZ01": {
              "type": "object",
              "keyCount": 7,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "외부몰",
                "무신사",
                "쇼핑몰",
                "자사몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "외부몰": "array",
                "무신사": "array",
                "쇼핑몰": "array",
                "자사몰": "array"
              }
            },
            "CO2404DP20": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "자사몰",
                "외부몰",
                "무신사",
                "면세점",
                "해외 위탁"
              ],
              "childTypes": {
                "자사몰": "array",
                "외부몰": "array",
                "무신사": "array",
                "면세점": "array",
                "해외 위탁": "array"
              }
            },
            "CO2403CR10": {
              "type": "object",
              "keyCount": 4,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "외부몰",
                "해외 위탁"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "외부몰": "array",
                "해외 위탁": "array"
              }
            },
            "CO2506TC72": {
              "type": "object",
              "keyCount": 9,
              "sampleKeys": [
                "백화점",
                "직영점",
                "면세점",
                "아울렛",
                "자사몰",
                "쇼핑몰"
              ],
              "childTypes": {
                "백화점": "array",
                "직영점": "array",
                "면세점": "array",
                "아울렛": "array",
                "자사몰": "array",
                "쇼핑몰": "array"
              }
            }
          }
        }
      }
    },
    "26-07M": {
      "type": "object",
      "keyCount": 2,
      "sampleKeys": [
        "cur",
        "prev"
      ],
      "childTypes": {
        "cur": "object",
        "prev": "object"
      },
      "sampleChildren": {
        "cur": {
          "type": "object",
          "keyCount": 3490,
          "sampleKeys": [
            "CO2606SE05",
            "CO2602SO35",
            "CO2402KT71",
            "CO2602ST05",
            "CO2602ST01",
            "CO2506CA02"
          ],
          "childTypes": {
            "CO2606SE05": "object",
            "CO2602SO35": "object",
            "CO2402KT71": "object",
            "CO2602ST05": "object",
            "CO2602ST01": "object",
            "CO2506CA02": "object"
          },
          "sampleChildren": {
            "CO2606SE05": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "백화점",
                "쇼핑몰",
                "아울렛",
                "직영점",
                "해외 위탁",
                "면세점"
              ],
              "childTypes": {
                "백화점": "array",
                "쇼핑몰": "array",
                "아울렛": "array",
                "직영점": "array",
                "해외 위탁": "array",
                "면세점": "array"
              }
            },
            "CO2602SO35": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "쇼핑몰",
                "직영점",
                "무신사",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "무신사": "array",
                "외부몰": "array"
              }
            },
            "CO2402KT71": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "위탁사",
                "백화점",
                "아울렛",
                "자사몰",
                "해외 위탁"
              ],
              "childTypes": {
                "위탁사": "array",
                "백화점": "array",
                "아울렛": "array",
                "자사몰": "array",
                "해외 위탁": "array"
              }
            },
            "CO2602ST05": {
              "type": "object",
              "keyCount": 9,
              "sampleKeys": [
                "백화점",
                "아울렛",
                "쇼핑몰",
                "면세점",
                "직영점",
                "외부몰"
              ],
              "childTypes": {
                "백화점": "array",
                "아울렛": "array",
                "쇼핑몰": "array",
                "면세점": "array",
                "직영점": "array",
                "외부몰": "array"
              }
            },
            "CO2602ST01": {
              "type": "object",
              "keyCount": 12,
              "sampleKeys": [
                "위탁사",
                "백화점",
                "쇼핑몰",
                "직영점",
                "외부몰",
                "아울렛"
              ],
              "childTypes": {
                "위탁사": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "외부몰": "array",
                "아울렛": "array"
              }
            },
            "CO2506CA02": {
              "type": "object",
              "keyCount": 12,
              "sampleKeys": [
                "직영점",
                "아울렛",
                "무신사",
                "대리점",
                "외부몰",
                "백화점"
              ],
              "childTypes": {
                "직영점": "array",
                "아울렛": "array",
                "무신사": "array",
                "대리점": "array",
                "외부몰": "array",
                "백화점": "array"
              }
            }
          }
        },
        "prev": {
          "type": "object",
          "keyCount": 2909,
          "sampleKeys": [
            "CO2502STE1",
            "CO2401HD02",
            "CO2403HZ01",
            "CO2404DP20",
            "CO2403CR10",
            "CO2506TC72"
          ],
          "childTypes": {
            "CO2502STE1": "object",
            "CO2401HD02": "object",
            "CO2403HZ01": "object",
            "CO2404DP20": "object",
            "CO2403CR10": "object",
            "CO2506TC72": "object"
          },
          "sampleChildren": {
            "CO2502STE1": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "무신사",
                "직영점",
                "백화점",
                "외부몰",
                "대리점",
                "쇼핑몰"
              ],
              "childTypes": {
                "무신사": "array",
                "직영점": "array",
                "백화점": "array",
                "외부몰": "array",
                "대리점": "array",
                "쇼핑몰": "array"
              }
            },
            "CO2401HD02": {
              "type": "object",
              "keyCount": 4,
              "sampleKeys": [
                "백화점",
                "무신사",
                "외부몰",
                "자사몰"
              ],
              "childTypes": {
                "백화점": "array",
                "무신사": "array",
                "외부몰": "array",
                "자사몰": "array"
              }
            },
            "CO2403HZ01": {
              "type": "object",
              "keyCount": 8,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "외부몰",
                "무신사",
                "쇼핑몰",
                "해외 위탁"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "외부몰": "array",
                "무신사": "array",
                "쇼핑몰": "array",
                "해외 위탁": "array"
              }
            },
            "CO2404DP20": {
              "type": "object",
              "keyCount": 4,
              "sampleKeys": [
                "자사몰",
                "외부몰",
                "면세점",
                "해외 위탁"
              ],
              "childTypes": {
                "자사몰": "array",
                "외부몰": "array",
                "면세점": "array",
                "해외 위탁": "array"
              }
            },
            "CO2403CR10": {
              "type": "object",
              "keyCount": 5,
              "sampleKeys": [
                "아울렛",
                "외부몰",
                "자사몰",
                "면세점",
                "해외 위탁"
              ],
              "childTypes": {
                "아울렛": "array",
                "외부몰": "array",
                "자사몰": "array",
                "면세점": "array",
                "해외 위탁": "array"
              }
            },
            "CO2506TC72": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "백화점",
                "직영점",
                "면세점",
                "아울렛",
                "외부몰",
                "자사몰"
              ],
              "childTypes": {
                "백화점": "array",
                "직영점": "array",
                "면세점": "array",
                "아울렛": "array",
                "외부몰": "array",
                "자사몰": "array"
              }
            }
          }
        }
      }
    },
    "26-08M": {
      "type": "object",
      "keyCount": 2,
      "sampleKeys": [
        "cur",
        "prev"
      ],
      "childTypes": {
        "cur": "object",
        "prev": "object"
      },
      "sampleChildren": {
        "cur": {
          "type": "object",
          "keyCount": 3852,
          "sampleKeys": [
            "CO2606SE05",
            "CO2602SO35",
            "CO2402KT71",
            "CO2602ST05",
            "CO2602ST01",
            "CO2506CA02"
          ],
          "childTypes": {
            "CO2606SE05": "object",
            "CO2602SO35": "object",
            "CO2402KT71": "object",
            "CO2602ST05": "object",
            "CO2602ST01": "object",
            "CO2506CA02": "object"
          },
          "sampleChildren": {
            "CO2606SE05": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "백화점",
                "쇼핑몰",
                "아울렛",
                "직영점",
                "해외 위탁",
                "면세점"
              ],
              "childTypes": {
                "백화점": "array",
                "쇼핑몰": "array",
                "아울렛": "array",
                "직영점": "array",
                "해외 위탁": "array",
                "면세점": "array"
              }
            },
            "CO2602SO35": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "쇼핑몰",
                "직영점",
                "무신사",
                "외부몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "무신사": "array",
                "외부몰": "array"
              }
            },
            "CO2402KT71": {
              "type": "object",
              "keyCount": 2,
              "sampleKeys": [
                "위탁사",
                "아울렛"
              ],
              "childTypes": {
                "위탁사": "array",
                "아울렛": "array"
              }
            },
            "CO2602ST05": {
              "type": "object",
              "keyCount": 10,
              "sampleKeys": [
                "백화점",
                "아울렛",
                "쇼핑몰",
                "면세점",
                "직영점",
                "외부몰"
              ],
              "childTypes": {
                "백화점": "array",
                "아울렛": "array",
                "쇼핑몰": "array",
                "면세점": "array",
                "직영점": "array",
                "외부몰": "array"
              }
            },
            "CO2602ST01": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "위탁사",
                "백화점",
                "쇼핑몰",
                "직영점",
                "외부몰",
                "아울렛"
              ],
              "childTypes": {
                "위탁사": "array",
                "백화점": "array",
                "쇼핑몰": "array",
                "직영점": "array",
                "외부몰": "array",
                "아울렛": "array"
              }
            },
            "CO2506CA02": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "직영점",
                "아울렛",
                "무신사",
                "대리점",
                "외부몰",
                "백화점"
              ],
              "childTypes": {
                "직영점": "array",
                "아울렛": "array",
                "무신사": "array",
                "대리점": "array",
                "외부몰": "array",
                "백화점": "array"
              }
            }
          }
        },
        "prev": {
          "type": "object",
          "keyCount": 3165,
          "sampleKeys": [
            "CO2502STE1",
            "CO2401HD02",
            "CO2503HD70",
            "CO2403HZ01",
            "CO2404DP20",
            "CO2403CR10"
          ],
          "childTypes": {
            "CO2502STE1": "object",
            "CO2401HD02": "object",
            "CO2503HD70": "object",
            "CO2403HZ01": "object",
            "CO2404DP20": "object",
            "CO2403CR10": "object"
          },
          "sampleChildren": {
            "CO2502STE1": {
              "type": "object",
              "keyCount": 11,
              "sampleKeys": [
                "무신사",
                "직영점",
                "백화점",
                "외부몰",
                "대리점",
                "쇼핑몰"
              ],
              "childTypes": {
                "무신사": "array",
                "직영점": "array",
                "백화점": "array",
                "외부몰": "array",
                "대리점": "array",
                "쇼핑몰": "array"
              }
            },
            "CO2401HD02": {
              "type": "object",
              "keyCount": 4,
              "sampleKeys": [
                "백화점",
                "무신사",
                "외부몰",
                "자사몰"
              ],
              "childTypes": {
                "백화점": "array",
                "무신사": "array",
                "외부몰": "array",
                "자사몰": "array"
              }
            },
            "CO2503HD70": {
              "type": "object",
              "keyCount": 7,
              "sampleKeys": [
                "아울렛",
                "직영점",
                "백화점",
                "대리점",
                "면세점",
                "자사몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "직영점": "array",
                "백화점": "array",
                "대리점": "array",
                "면세점": "array",
                "자사몰": "array"
              }
            },
            "CO2403HZ01": {
              "type": "object",
              "keyCount": 7,
              "sampleKeys": [
                "아울렛",
                "백화점",
                "외부몰",
                "무신사",
                "쇼핑몰",
                "자사몰"
              ],
              "childTypes": {
                "아울렛": "array",
                "백화점": "array",
                "외부몰": "array",
                "무신사": "array",
                "쇼핑몰": "array",
                "자사몰": "array"
              }
            },
            "CO2404DP20": {
              "type": "object",
              "keyCount": 4,
              "sampleKeys": [
                "자사몰",
                "아울렛",
                "외부몰",
                "무신사"
              ],
              "childTypes": {
                "자사몰": "array",
                "아울렛": "array",
                "외부몰": "array",
                "무신사": "array"
              }
            },
            "CO2403CR10": {
              "type": "object",
              "keyCount": 6,
              "sampleKeys": [
                "아울렛",
                "무신사",
                "백화점",
                "외부몰",
                "면세점",
                "해외 위탁"
              ],
              "childTypes": {
                "아울렛": "array",
                "무신사": "array",
                "백화점": "array",
                "외부몰": "array",
                "면세점": "array",
                "해외 위탁": "array"
              }
            }
          }
        }
      }
    }
  },
  "knownSkuDirectByKey": {
    "26-01W1": false,
    "26-01W2": false,
    "26-01W3": false,
    "26-01W4": false,
    "26-01W5": false,
    "26-02W1": false,
    "26-02W2": false,
    "26-02W3": false,
    "26-02W4": false,
    "26-03W1": false,
    "26-03W2": false,
    "26-03W3": false,
    "26-03W4": false,
    "26-04W1": false,
    "26-04W2": false,
    "26-04W3": false,
    "26-04W4": false,
    "26-04W5": false,
    "26-05W1": false,
    "26-05W2": false,
    "26-05W3": false,
    "26-05W4": false,
    "26-06W1": false,
    "26-06W2": false,
    "26-06W3": false,
    "26-06W4": false,
    "26-07W1": false,
    "26-07W2": false,
    "26-07W3": false,
    "26-07W4": false,
    "26-07W5": false,
    "26-08W1": false,
    "26-08W2": false,
    "26-08W3": false,
    "26-08W4": false,
    "26-09W1": false,
    "26-01M": false,
    "26-02M": false,
    "26-03M": false,
    "26-04M": false,
    "26-05M": false,
    "26-06M": false,
    "26-07M": false,
    "26-08M": false
  },
  "knownSkuPathSamples": [
    "26-01W3.cur.WA2602CD52",
    "26-01W4.cur.WA2602CD52",
    "26-01W5.cur.WA2602CD52",
    "26-02W1.cur.WA2602CD52",
    "26-02W2.cur.WA2602CD52",
    "26-02W3.cur.WA2602CD52",
    "26-02W4.cur.WA2602CD52",
    "26-03W1.cur.WA2602CD52",
    "26-03W2.cur.WA2602CD52",
    "26-03W3.cur.WA2602CD52",
    "26-03W4.cur.WA2602CD52",
    "26-04W1.cur.WA2602CD52",
    "26-04W2.cur.WA2602CD52",
    "26-04W3.cur.WA2602CD52",
    "26-04W4.cur.WA2602CD52",
    "26-04W5.cur.WA2602CD52",
    "26-05W1.cur.WA2602CD52",
    "26-05W2.cur.WA2602CD52",
    "26-05W3.cur.WA2602CD52",
    "26-05W4.cur.WA2602CD52"
  ]
}
```

### ORD

```json
{
  "keys": [
    "CO",
    "LE",
    "WA"
  ],
  "waShape": {
    "type": "object",
    "keyCount": 28,
    "sampleKeys": [
      "ST",
      "SO",
      "CB",
      "PT",
      "KT",
      "SS"
    ],
    "childTypes": {
      "ST": "object",
      "SO": "object",
      "CB": "object",
      "PT": "object",
      "KT": "object",
      "SS": "object"
    },
    "sampleChildren": {
      "ST": {
        "type": "object",
        "keyCount": 6,
        "sampleKeys": [
          "curFW",
          "curSS",
          "curXX",
          "prevFW",
          "prevSS",
          "prevXX"
        ],
        "childTypes": {
          "curFW": "array",
          "curSS": "array",
          "curXX": "array",
          "prevFW": "array",
          "prevSS": "array",
          "prevXX": "array"
        },
        "sampleChildren": {
          "curFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          }
        }
      },
      "SO": {
        "type": "object",
        "keyCount": 6,
        "sampleKeys": [
          "curFW",
          "curSS",
          "curXX",
          "prevFW",
          "prevSS",
          "prevXX"
        ],
        "childTypes": {
          "curFW": "array",
          "curSS": "array",
          "curXX": "array",
          "prevFW": "array",
          "prevSS": "array",
          "prevXX": "array"
        },
        "sampleChildren": {
          "curFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          }
        }
      },
      "CB": {
        "type": "object",
        "keyCount": 6,
        "sampleKeys": [
          "curFW",
          "curSS",
          "curXX",
          "prevFW",
          "prevSS",
          "prevXX"
        ],
        "childTypes": {
          "curFW": "array",
          "curSS": "array",
          "curXX": "array",
          "prevFW": "array",
          "prevSS": "array",
          "prevXX": "array"
        },
        "sampleChildren": {
          "curFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          }
        }
      },
      "PT": {
        "type": "object",
        "keyCount": 6,
        "sampleKeys": [
          "curFW",
          "curSS",
          "curXX",
          "prevFW",
          "prevSS",
          "prevXX"
        ],
        "childTypes": {
          "curFW": "array",
          "curSS": "array",
          "curXX": "array",
          "prevFW": "array",
          "prevSS": "array",
          "prevXX": "array"
        },
        "sampleChildren": {
          "curFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          }
        }
      },
      "KT": {
        "type": "object",
        "keyCount": 6,
        "sampleKeys": [
          "curFW",
          "curSS",
          "curXX",
          "prevFW",
          "prevSS",
          "prevXX"
        ],
        "childTypes": {
          "curFW": "array",
          "curSS": "array",
          "curXX": "array",
          "prevFW": "array",
          "prevSS": "array",
          "prevXX": "array"
        },
        "sampleChildren": {
          "curFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          }
        }
      },
      "SS": {
        "type": "object",
        "keyCount": 6,
        "sampleKeys": [
          "curFW",
          "curSS",
          "curXX",
          "prevFW",
          "prevSS",
          "prevXX"
        ],
        "childTypes": {
          "curFW": "array",
          "curSS": "array",
          "curXX": "array",
          "prevFW": "array",
          "prevSS": "array",
          "prevXX": "array"
        },
        "sampleChildren": {
          "curFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "curXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevFW": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevSS": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          },
          "prevXX": {
            "type": "array",
            "length": 5,
            "itemTypes": [
              "number",
              "number",
              "number",
              "number",
              "number"
            ]
          }
        }
      }
    }
  },
  "waContainsKnownSku": false,
  "waKnownSkuPathSamples": []
}
```

### ATOM

```json
{
  "keys": [
    "24",
    "25",
    "26"
  ],
  "atom26Shape": {
    "type": "object",
    "keyCount": 3,
    "sampleKeys": [
      "LE",
      "WA",
      "CO"
    ],
    "childTypes": {
      "LE": "object",
      "WA": "object",
      "CO": "object"
    },
    "sampleChildren": {
      "LE": {
        "type": "object",
        "keyCount": 13,
        "sampleKeys": [
          "아울렛",
          "직영점",
          "면세점",
          "백화점",
          "위탁사",
          "쇼핑몰"
        ],
        "childTypes": {
          "아울렛": "object",
          "직영점": "object",
          "면세점": "object",
          "백화점": "object",
          "위탁사": "object",
          "쇼핑몰": "object"
        },
        "sampleChildren": {
          "아울렛": {
            "type": "object",
            "keyCount": 27,
            "sampleKeys": [
              "ST",
              "BG",
              "JK",
              "KT",
              "OP",
              "SO"
            ],
            "childTypes": {
              "ST": "object",
              "BG": "object",
              "JK": "object",
              "KT": "object",
              "OP": "object",
              "SO": "object"
            }
          },
          "직영점": {
            "type": "object",
            "keyCount": 26,
            "sampleKeys": [
              "SE",
              "ST",
              "CA",
              "IS",
              "IP",
              "SH"
            ],
            "childTypes": {
              "SE": "object",
              "ST": "object",
              "CA": "object",
              "IS": "object",
              "IP": "object",
              "SH": "object"
            }
          },
          "면세점": {
            "type": "object",
            "keyCount": 23,
            "sampleKeys": [
              "ST",
              "CA",
              "CR",
              "BG",
              "SO",
              "SS"
            ],
            "childTypes": {
              "ST": "object",
              "CA": "object",
              "CR": "object",
              "BG": "object",
              "SO": "object",
              "SS": "object"
            }
          },
          "백화점": {
            "type": "object",
            "keyCount": 27,
            "sampleKeys": [
              "PT",
              "CA",
              "ST",
              "LT",
              "SS",
              "SH"
            ],
            "childTypes": {
              "PT": "object",
              "CA": "object",
              "ST": "object",
              "LT": "object",
              "SS": "object",
              "SH": "object"
            }
          },
          "위탁사": {
            "type": "object",
            "keyCount": 23,
            "sampleKeys": [
              "ST",
              "CA",
              "PT",
              "SS",
              "SO",
              "BG"
            ],
            "childTypes": {
              "ST": "object",
              "CA": "object",
              "PT": "object",
              "SS": "object",
              "SO": "object",
              "BG": "object"
            }
          },
          "쇼핑몰": {
            "type": "object",
            "keyCount": 26,
            "sampleKeys": [
              "ST",
              "BG",
              "SO",
              "IP",
              "IS",
              "CA"
            ],
            "childTypes": {
              "ST": "object",
              "BG": "object",
              "SO": "object",
              "IP": "object",
              "IS": "object",
              "CA": "object"
            }
          }
        }
      },
      "WA": {
        "type": "object",
        "keyCount": 13,
        "sampleKeys": [
          "자사몰",
          "아울렛",
          "백화점",
          "직영점",
          "면세점",
          "외부몰"
        ],
        "childTypes": {
          "자사몰": "object",
          "아울렛": "object",
          "백화점": "object",
          "직영점": "object",
          "면세점": "object",
          "외부몰": "object"
        },
        "sampleChildren": {
          "자사몰": {
            "type": "object",
            "keyCount": 27,
            "sampleKeys": [
              "SS",
              "JK",
              "PT",
              "CB",
              "CR",
              "DP"
            ],
            "childTypes": {
              "SS": "object",
              "JK": "object",
              "PT": "object",
              "CB": "object",
              "CR": "object",
              "DP": "object"
            }
          },
          "아울렛": {
            "type": "object",
            "keyCount": 27,
            "sampleKeys": [
              "SE",
              "HZ",
              "SO",
              "ST",
              "TC",
              "PT"
            ],
            "childTypes": {
              "SE": "object",
              "HZ": "object",
              "SO": "object",
              "ST": "object",
              "TC": "object",
              "PT": "object"
            }
          },
          "백화점": {
            "type": "object",
            "keyCount": 27,
            "sampleKeys": [
              "SO",
              "ST",
              "CA",
              "CD",
              "SE",
              "JK"
            ],
            "childTypes": {
              "SO": "object",
              "ST": "object",
              "CA": "object",
              "CD": "object",
              "SE": "object",
              "JK": "object"
            }
          },
          "직영점": {
            "type": "object",
            "keyCount": 27,
            "sampleKeys": [
              "ST",
              "SO",
              "TC",
              "PT",
              "CA",
              "SS"
            ],
            "childTypes": {
              "ST": "object",
              "SO": "object",
              "TC": "object",
              "PT": "object",
              "CA": "object",
              "SS": "object"
            }
          },
          "면세점": {
            "type": "object",
            "keyCount": 27,
            "sampleKeys": [
              "ST",
              "KT",
              "CA",
              "TC",
              "PT",
              "SH"
            ],
            "childTypes": {
              "ST": "object",
              "KT": "object",
              "CA": "object",
              "TC": "object",
              "PT": "object",
              "SH": "object"
            }
          },
          "외부몰": {
            "type": "object",
            "keyCount": 26,
            "sampleKeys": [
              "ST",
              "LT",
              "HZ",
              "TC",
              "CR",
              "CD"
            ],
            "childTypes": {
              "ST": "object",
              "LT": "object",
              "HZ": "object",
              "TC": "object",
              "CR": "object",
              "CD": "object"
            }
          }
        }
      },
      "CO": {
        "type": "object",
        "keyCount": 14,
        "sampleKeys": [
          "백화점",
          "아울렛",
          "위탁사",
          "직영점",
          "쇼핑몰",
          "무신사"
        ],
        "childTypes": {
          "백화점": "object",
          "아울렛": "object",
          "위탁사": "object",
          "직영점": "object",
          "쇼핑몰": "object",
          "무신사": "object"
        },
        "sampleChildren": {
          "백화점": {
            "type": "object",
            "keyCount": 28,
            "sampleKeys": [
              "SE",
              "ST",
              "SO",
              "SS",
              "KT",
              "CA"
            ],
            "childTypes": {
              "SE": "object",
              "ST": "object",
              "SO": "object",
              "SS": "object",
              "KT": "object",
              "CA": "object"
            }
          },
          "아울렛": {
            "type": "object",
            "keyCount": 29,
            "sampleKeys": [
              "SO",
              "KT",
              "ST",
              "CA",
              "OP",
              "SH"
            ],
            "childTypes": {
              "SO": "object",
              "KT": "object",
              "ST": "object",
              "CA": "object",
              "OP": "object",
              "SH": "object"
            }
          },
          "위탁사": {
            "type": "object",
            "keyCount": 22,
            "sampleKeys": [
              "KT",
              "ST",
              "SO",
              "SS",
              "PT",
              "SE"
            ],
            "childTypes": {
              "KT": "object",
              "ST": "object",
              "SO": "object",
              "SS": "object",
              "PT": "object",
              "SE": "object"
            }
          },
          "직영점": {
            "type": "object",
            "keyCount": 27,
            "sampleKeys": [
              "CA",
              "ST",
              "EC",
              "SS",
              "BP",
              "TC"
            ],
            "childTypes": {
              "CA": "object",
              "ST": "object",
              "EC": "object",
              "SS": "object",
              "BP": "object",
              "TC": "object"
            }
          },
          "쇼핑몰": {
            "type": "object",
            "keyCount": 27,
            "sampleKeys": [
              "BP",
              "ST",
              "SE",
              "PT",
              "OP",
              "SO"
            ],
            "childTypes": {
              "BP": "object",
              "ST": "object",
              "SE": "object",
              "PT": "object",
              "OP": "object",
              "SO": "object"
            }
          },
          "무신사": {
            "type": "object",
            "keyCount": 35,
            "sampleKeys": [
              "ST",
              "TC",
              "BP",
              "SO",
              "CA",
              "TB"
            ],
            "childTypes": {
              "ST": "object",
              "TC": "object",
              "BP": "object",
              "SO": "object",
              "CA": "object",
              "TB": "object"
            }
          }
        }
      }
    }
  },
  "atom26TextSamples": []
}
```

### IMG

```json
{
  "knownSkuType": "string",
  "knownSkuSample": "data:image/webp;"
}
```

### Known SKU Cross Checks

```json
{
  "pmeta": [
    26,
    "SS",
    "CD",
    0.7135,
    468000000,
    5200,
    "WA",
    5225,
    3710,
    19600,
    "우먼스 릴리와펜 라운드넥 반팔 가디건",
    1253,
    170
  ],
  "pdetShape": {
    "type": "object",
    "keyCount": 2,
    "sampleKeys": [
      "srp",
      "ch"
    ],
    "childTypes": {
      "srp": "number",
      "ch": "object"
    },
    "sampleChildren": {
      "srp": {
        "type": "number",
        "sample": 99000
      },
      "ch": {
        "type": "object",
        "keyCount": 12,
        "sampleKeys": [
          "면세점",
          "직영점",
          "자사몰",
          "백화점",
          "쇼핑몰",
          "아울렛"
        ],
        "childTypes": {
          "면세점": "array",
          "직영점": "array",
          "자사몰": "array",
          "백화점": "array",
          "쇼핑몰": "array",
          "아울렛": "array"
        },
        "sampleChildren": {
          "면세점": {
            "type": "array",
            "length": 3,
            "itemTypes": [
              "number",
              "number",
              "number"
            ]
          },
          "직영점": {
            "type": "array",
            "length": 3,
            "itemTypes": [
              "number",
              "number",
              "number"
            ]
          },
          "자사몰": {
            "type": "array",
            "length": 3,
            "itemTypes": [
              "number",
              "number",
              "number"
            ]
          },
          "백화점": {
            "type": "array",
            "length": 3,
            "itemTypes": [
              "number",
              "number",
              "number"
            ]
          },
          "쇼핑몰": {
            "type": "array",
            "length": 3,
            "itemTypes": [
              "number",
              "number",
              "number"
            ]
          },
          "아울렛": {
            "type": "array",
            "length": 3,
            "itemTypes": [
              "number",
              "number",
              "number"
            ]
          }
        }
      }
    }
  },
  "pdetSums": {
    "amount0": 302390568.7,
    "amount1": 333900000,
    "qty2": 3710
  },
  "pdetQty2EqualsPmeta8": true,
  "pmeta3EqualsPmeta8Over5": false,
  "pmeta4EqualsPmeta5TimesSrpVatMinus": true
}
```

## Dashboard Inline/Runtime Code Usage

Inline scripts found:

```json
[
  {
    "index": 0,
    "length": 21696
  },
  {
    "index": 1,
    "length": 127
  },
  {
    "index": 11,
    "length": 2709316
  },
  {
    "index": 12,
    "length": 23972
  },
  {
    "index": 13,
    "length": 16163
  },
  {
    "index": 15,
    "length": 357
  },
  {
    "index": 16,
    "length": 347
  },
  {
    "index": 17,
    "length": 3278
  }
]
```

Relevant snippets:

### Inline script 11 (2709316 chars)
- PMETA: `omp,0)+'</b></span></div>' +'</div>';} document.getElementById('bokKpi').innerHTML=h; var sub=document.getElementById('bokKpiSub'); if(sub)sub.textContent=perLbl()+' · '+C.stabs[st.stab]+' 대표 복종'; } // TOP10 — PDPER 버킷별 실판매(백만)를 선택 채널 합산·재랭킹(임의 조합 정확). cur=당해26/prev=전년25 동기간. // PDPER 버킷=[m_sale,m_tag,m_qty,w_sale,w_tag,w_qty,pm_sale,pw_sale](백만·수량정수) → ×MM로 원 복원해 카드 구성. // 정적필드(발주·판매율누계·시즌·복종·브랜드)=PMETA. 카드 객체 형태는 기존과 동일(렌더·모달 재사용). function topCands(brand,which){ // 연간 누적(st.period===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=PMAP[window.__PK]||{}, acm=pkE.acm; var base=(window.PDPER_ANN&&window.PDPER_ANN[acm]&&window.PDPER_ANN[acm][which])||{}; // 연간 = 완료월 누적(base=PDPER_ANN[acm]) + 진행 부분월(당월 PDPER, 주간기간만) → 1/1~현재 `
- PMETA: `)+' · '+C.stabs[st.stab]+' 대표 복종'; } // TOP10 — PDPER 버킷별 실판매(백만)를 선택 채널 합산·재랭킹(임의 조합 정확). cur=당해26/prev=전년25 동기간. // PDPER 버킷=[m_sale,m_tag,m_qty,w_sale,w_tag,w_qty,pm_sale,pw_sale](백만·수량정수) → ×MM로 원 복원해 카드 구성. // 정적필드(발주·판매율누계·시즌·복종·브랜드)=PMETA. 카드 객체 형태는 기존과 동일(렌더·모달 재사용). function topCands(brand,which){ // 연간 누적(st.period===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=PMAP[window.__PK]||{}, acm=pkE.acm; var base=(window.PDPER_ANN&&window.PDPER_ANN[acm]&&window.PDPER_ANN[acm][which])||{}; // 연간 = 완료월 누적(base=PDPER_ANN[acm]) + 진행 부분월(당월 PDPER, 주간기간만) → 1/1~현재 var addCur=(pkE.kind==='wk')?((window.PDPER&&window.PDPER[window.__PK]&&window.PDPER[window.__PK][which])||{}):null; pd={}; for(var _pn in base){var bb=base[_pn];p`
- PMETA: `display:none"');} if(!has||(gCt<=0&&gPt<=0&&gCq<=0))continue; rows+=trow('pm-g','<span class="pm-car">▸</span>'+gname+' TTL',gCq,gCt,gPq,gPt,' data-pg="'+gi+'"')+subs;} // ── 요약 블록 = 상품 대시보드 상품 모달과 동일 구성 ── // 히어로(기간 실적 + 누계 실판매 서브 + 할인율/판매 기간) / 지표 6칸(발주·순입고·판매누계· // 판매율누계(+입고 판매율)·할인율누계). 급상승 탭만 hero 를 증분 수량으로 바꾸고 '직전' 칸 추가. var iq=c.iq, cumQ=(c.sq!=null?c.sq:TQTY); // 순입고·누계판매 수량(PMETA=상품 대시보드와 동일 원천) var sellIn=(iq?cumQ/iq:null); // 입고 판매율 = 누계판매 ÷ 순입고 // 전체재고 = 매장 가용(SW_SHOPINV.AVAILQTY) + 창고 가용(SW_WHINV.AVAILQTY) — 상품 대시보드와 동일 기준 var tiv=(c.iv!=null||c.wiv!=null)?((c.iv||0)+(c.wiv||0)):null; // 순입고가 있으면 항상 표기(값이 같아 보여도 숨기지 않는다 — 상품 대시보드와 동일 규칙) var sellInSub=(sellIn!=null)?'<span class="mbd">입고 판매율 '+pct(sellIn)+'</span>':''; var bigLab=rise?('직전比 증가 · '+`
- PDET: `P10 상품 상세 모달 (카드 클릭) ────────────────────────────── var PMG=[['온라인',['자사몰','무신사','외부몰','기타(온)']], ['샵인샵',['백화점','쇼핑몰','아울렛']], ['리테일',['직영점','면세점','위탁사']], ['기타',['대리점','기타(오프)']], ['해외',['해외 위탁','해외 사입']]]; function openProd(kk){ var c=window.__TM&&window.__TM[kk]; if(!c)return; var _p=kk.split(':'), which=_p[0], pn=_p[1]; var w=(st.period===1), rise=(st.toptab===1), pk=window.__PK; var pd=(window.PDET&&window.PDET[pn])||{srp:0,ch:{}}, ch=pd.ch||{}; var pp=(window.PDPER&&window.PDPER[pk]&&window.PDPER[pk][which]&&window.PDPER[pk][which][pn])||null; // VAT 기준 분리: 매출/실판매/할인율=채널별 VAT(원본, 면세·해외 ÷1.0) · 소진율(비중)·표 TAG=발주와 동일 ÷1.1 일괄 function isf(bk){return bk.indexOf('면세')>=0||bk.indexOf('해외')>=0;} function nt(bk,t){return isf(bk)?t/1.1:t;} // 소진율용 TAG(면세/해외를 ÷1.1로 재환산) // 누계: 실판매·raw TAG(할인율용) `
- PDET: `(카드 클릭) ────────────────────────────── var PMG=[['온라인',['자사몰','무신사','외부몰','기타(온)']], ['샵인샵',['백화점','쇼핑몰','아울렛']], ['리테일',['직영점','면세점','위탁사']], ['기타',['대리점','기타(오프)']], ['해외',['해외 위탁','해외 사입']]]; function openProd(kk){ var c=window.__TM&&window.__TM[kk]; if(!c)return; var _p=kk.split(':'), which=_p[0], pn=_p[1]; var w=(st.period===1), rise=(st.toptab===1), pk=window.__PK; var pd=(window.PDET&&window.PDET[pn])||{srp:0,ch:{}}, ch=pd.ch||{}; var pp=(window.PDPER&&window.PDPER[pk]&&window.PDPER[pk][which]&&window.PDPER[pk][which][pn])||null; // VAT 기준 분리: 매출/실판매/할인율=채널별 VAT(원본, 면세·해외 ÷1.0) · 소진율(비중)·표 TAG=발주와 동일 ÷1.1 일괄 function isf(bk){return bk.indexOf('면세')>=0||bk.indexOf('해외')>=0;} function nt(bk,t){return isf(bk)?t/1.1:t;} // 소진율용 TAG(면세/해외를 ÷1.1로 재환산) // 누계: 실판매·raw TAG(할인율용) + 정규 TAG(표·비중`
- PDPER: `, "2026-07-31"], "ann25": ["2025-01-02", "2025-08-01"]}, "acm": 7}, {"key": "26-08M", "kind": "close", "label": "8월 마감", "m": 8, "wk": 0, "sub": "8/1~8/31", "win": {"mtd26": ["2026-08-01", "2026-08-31"], "mtd25": ["2025-08-01", "2025-08-31"], "wkcur": ["2026-08-24", "2026-08-30"], "wk25": ["2025-08-25", "2025-08-31"], "ann26": ["2026-01-01", "2026-08-31"], "ann25": ["2025-01-02", "2025-09-01"]}, "acm": 8}]; window.PDPER_ANN=__gz('H4sIABzrmGoC/6y9S6sl23Ym9leMWlWwuMz3jKhe5s6UUicPyk3uLcQ9Ri3/A4NbhUEqybhhN8pggco2hVp22aghgzBq+BfVPfc/OOac8ZgzxveNiJXXgnOLOnly77Ui5mOMb3yPf/tH9o/+zb/9o//qv/mvy//z8s1Fk14+GFf+f7/+H3/969//9a//8O//6N/8l/Y388P9xjxi+svHH/36d3/76//yL7/7h/91+QP3m/Twyx9MYfmD3/3jP//6P/zDr//uH5c/CMu/DL/JD+t9+ZP/8a9+97//Y/tZ5jfuUf6pP+o//Mvv/p+/+t3/9U/Lv/fLvwu/iQ/ryp/87p/+79//h/+5/Q33G/8ovyi75Q9+/3f/vPyt/+LX/+1vf/83f13/Wnyk5T+weSo/8L//f`
- PDPER: `ue;var days=wd[yk]; for(var b in A){var Ab=A[b];for(var bk in Ab){var Abk=Ab[bk]; for(var c in Abk){var cells=Abk[c],Z=ens(b,bk,c),arr=Z[period]; if(!arr)arr=Z[period]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; for(var j=0;j<days.length;j++){var v=cells[days[j]];if(v){for(var i=0;i<15;i++)arr[i]+=v[i];}}}}}} }); return cat;} function rebuild(pk){window.__PK=pk;D.cat=aggCat(pk); // TOP10은 renderTop이 PDPER[pk]에서 직접 계산 var e=PMAP[pk],inf=document.getElementById('annInfo'); if(inf){var W=e.win;inf.textContent=(e.kind==='close'?'마감 ':'당월 ')+W.mtd26[0].slice(5)+'~'+W.mtd26[1].slice(5) +' · 주간 '+W.wkcur[0].slice(5)+'~'+W.wkcur[1].slice(5)+' · 전년 동기 매칭';} renderAll();} var st={brand:0,period:0,season:0,chsel:{},stab:0,toptab:0,exp2:{},sortKey:'실적',sortDir:-1}; function brandsSel(){var b=C.brands[st.brand][2];re`
- PDPER: `b>'+pct(sell)+'</b></span><span>YoY '+chip(yoy)+'</span></div>' +'<div class="k6g"><span>할인 <b>'+pct(disc)+'</b></span><span>객단가 <b>'+(aov==null?'—':won(aov)+'원')+'</b></span><span>비중 <b>'+pct(comp,0)+'</b></span></div>' +'</div>';} document.getElementById('bokKpi').innerHTML=h; var sub=document.getElementById('bokKpiSub'); if(sub)sub.textContent=perLbl()+' · '+C.stabs[st.stab]+' 대표 복종'; } // TOP10 — PDPER 버킷별 실판매(백만)를 선택 채널 합산·재랭킹(임의 조합 정확). cur=당해26/prev=전년25 동기간. // PDPER 버킷=[m_sale,m_tag,m_qty,w_sale,w_tag,w_qty,pm_sale,pw_sale](백만·수량정수) → ×MM로 원 복원해 카드 구성. // 정적필드(발주·판매율누계·시즌·복종·브랜드)=PMETA. 카드 객체 형태는 기존과 동일(렌더·모달 재사용). function topCands(brand,which){ // 연간 누적(st.period===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=P`
- PDPER: `v class="k6g"><span>할인 <b>'+pct(disc)+'</b></span><span>객단가 <b>'+(aov==null?'—':won(aov)+'원')+'</b></span><span>비중 <b>'+pct(comp,0)+'</b></span></div>' +'</div>';} document.getElementById('bokKpi').innerHTML=h; var sub=document.getElementById('bokKpiSub'); if(sub)sub.textContent=perLbl()+' · '+C.stabs[st.stab]+' 대표 복종'; } // TOP10 — PDPER 버킷별 실판매(백만)를 선택 채널 합산·재랭킹(임의 조합 정확). cur=당해26/prev=전년25 동기간. // PDPER 버킷=[m_sale,m_tag,m_qty,w_sale,w_tag,w_qty,pm_sale,pw_sale](백만·수량정수) → ×MM로 원 복원해 카드 구성. // 정적필드(발주·판매율누계·시즌·복종·브랜드)=PMETA. 카드 객체 형태는 기존과 동일(렌더·모달 재사용). function topCands(brand,which){ // 연간 누적(st.period===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=PMAP[window.__PK]||{}, acm=pkE.acm; var base=(window.PDPER_ANN&&window.`
- PDPER: `ument.getElementById('bokKpiSub'); if(sub)sub.textContent=perLbl()+' · '+C.stabs[st.stab]+' 대표 복종'; } // TOP10 — PDPER 버킷별 실판매(백만)를 선택 채널 합산·재랭킹(임의 조합 정확). cur=당해26/prev=전년25 동기간. // PDPER 버킷=[m_sale,m_tag,m_qty,w_sale,w_tag,w_qty,pm_sale,pw_sale](백만·수량정수) → ×MM로 원 복원해 카드 구성. // 정적필드(발주·판매율누계·시즌·복종·브랜드)=PMETA. 카드 객체 형태는 기존과 동일(렌더·모달 재사용). function topCands(brand,which){ // 연간 누적(st.period===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=PMAP[window.__PK]||{}, acm=pkE.acm; var base=(window.PDPER_ANN&&window.PDPER_ANN[acm]&&window.PDPER_ANN[acm][which])||{}; // 연간 = 완료월 누적(base=PDPER_ANN[acm]) + 진행 부분월(당월 PDPER, 주간기간만) → 1/1~현재 var addCur=(pkE.kind==='wk')?((window.PDPER&&window.PDPER[window.__PK]&&window.PDPER[window.__PK][whic`
- PDPER: `iSub'); if(sub)sub.textContent=perLbl()+' · '+C.stabs[st.stab]+' 대표 복종'; } // TOP10 — PDPER 버킷별 실판매(백만)를 선택 채널 합산·재랭킹(임의 조합 정확). cur=당해26/prev=전년25 동기간. // PDPER 버킷=[m_sale,m_tag,m_qty,w_sale,w_tag,w_qty,pm_sale,pw_sale](백만·수량정수) → ×MM로 원 복원해 카드 구성. // 정적필드(발주·판매율누계·시즌·복종·브랜드)=PMETA. 카드 객체 형태는 기존과 동일(렌더·모달 재사용). function topCands(brand,which){ // 연간 누적(st.period===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=PMAP[window.__PK]||{}, acm=pkE.acm; var base=(window.PDPER_ANN&&window.PDPER_ANN[acm]&&window.PDPER_ANN[acm][which])||{}; // 연간 = 완료월 누적(base=PDPER_ANN[acm]) + 진행 부분월(당월 PDPER, 주간기간만) → 1/1~현재 var addCur=(pkE.kind==='wk')?((window.PDPER&&window.PDPER[window.__PK]&&window.PDPER[window.__PK][which])||{}):null; pd={}; `
- PDPER: `5 동기간. // PDPER 버킷=[m_sale,m_tag,m_qty,w_sale,w_tag,w_qty,pm_sale,pw_sale](백만·수량정수) → ×MM로 원 복원해 카드 구성. // 정적필드(발주·판매율누계·시즌·복종·브랜드)=PMETA. 카드 객체 형태는 기존과 동일(렌더·모달 재사용). function topCands(brand,which){ // 연간 누적(st.period===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=PMAP[window.__PK]||{}, acm=pkE.acm; var base=(window.PDPER_ANN&&window.PDPER_ANN[acm]&&window.PDPER_ANN[acm][which])||{}; // 연간 = 완료월 누적(base=PDPER_ANN[acm]) + 진행 부분월(당월 PDPER, 주간기간만) → 1/1~현재 var addCur=(pkE.kind==='wk')?((window.PDPER&&window.PDPER[window.__PK]&&window.PDPER[window.__PK][which])||{}):null; pd={}; for(var _pn in base){var bb=base[_pn];pd[_pn]={};for(var _bk in bb)pd[_pn][_bk]=[bb[_bk][0],bb[_bk][1],bb[_bk][2]];} if(addCur){for(var _p2 in add`
- PDPER: ` 버킷=[m_sale,m_tag,m_qty,w_sale,w_tag,w_qty,pm_sale,pw_sale](백만·수량정수) → ×MM로 원 복원해 카드 구성. // 정적필드(발주·판매율누계·시즌·복종·브랜드)=PMETA. 카드 객체 형태는 기존과 동일(렌더·모달 재사용). function topCands(brand,which){ // 연간 누적(st.period===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=PMAP[window.__PK]||{}, acm=pkE.acm; var base=(window.PDPER_ANN&&window.PDPER_ANN[acm]&&window.PDPER_ANN[acm][which])||{}; // 연간 = 완료월 누적(base=PDPER_ANN[acm]) + 진행 부분월(당월 PDPER, 주간기간만) → 1/1~현재 var addCur=(pkE.kind==='wk')?((window.PDPER&&window.PDPER[window.__PK]&&window.PDPER[window.__PK][which])||{}):null; pd={}; for(var _pn in base){var bb=base[_pn];pd[_pn]={};for(var _bk in bb)pd[_pn][_bk]=[bb[_bk][0],bb[_bk][1],bb[_bk][2]];} if(addCur){for(var _p2 in addCur){var cc=addCur`
- ORD: `XgPXAgeXimh9Yf3EsI7X7D0FS+3r/8rKGWA6rZVqImPSjdRQYK9dkvc3Wn+T5tA6VrBnaRBwf7CsAcVOu/RXXfx42GJMDt3DnG1WMGAdNF2IRpfilUaWfN17+s0yvVDYNZ4MyQwM0rV3derSPcIo1D/qCnO3TPYDLWrsUGHa8h2ju3koMEwjPxr5me4PDVhhzPLTFdYgN7NnZhpIWrsUdVnwCevmserx4cRt31/YDajsAWJhRUhX0io/hNjwdsTwbxEcJpYfZIMAU/aP/KK9UnC+4FEao2Ph7nXUsId/CYJ6J/gx5LBje/4KSZAEIbJAfuIKbCDxKyJ2qWV37OrAOOv2PiHuA3WzbSTYusnrkR3YYYCjSXM1B50wmgGqrrzDZEpI+TDG+7VlJtwcHrg8hzq6AliCdiCsPL/sORDOvZw+0naxkE7Fcj6CfV2BHksxGb341AxunG/MidyMk1IjxwLlwAM6zSKPXY14MhIShebfCJwAyMQA5Dd+HIeeTsUccGboOJPP61LXxY9Q5FuyKc/37ad67NeXB6T2TMiHAx9wioXg1iqmq6rT1idhQ1mIunvlz7rwXheOm4STMkZykdbofUESyMvOgElrDMTzk+44lALvjucbniv9ATDhBIN9Kru9ucvPfnQ4nuOG+8YaD7cPlBDNbK8uEYrrLg8iPpipo/B+g2bZAnwQkLXdhyFUSUanFpfzjplGtVLM2l1hWGwX9lYiNluXGSeeaCcmQbT3d385BNCR4MQaNnYpYmXy4ZxYMMr0bQShCc3JCVaznhz6d+qLbnBYQIw3B3Ovdaivvu0DPT/DiYy9jP+Lntqv6X7/WRifdwI`
- ORD: `f0O4mGZipVqaLkvlrHImMv7LRa4x9mvjzE6UOrF7PBTwiovctBzePgbNYbTUoSFB4gzmCD89a8a50cR4SXS9INHN1uwyOi1MFHVrPEyXQmmSG4oz3uNZSISZzpIwvOziyfPCKIGow5UsGWKcTLhUJqfXZBjgdmNHGVabUKcvXGm4DKpdNV5lsGkih+8xIZ+0PqaMYhmVBYOuEy1hLujHIjqYhBKIdo36WQUnnwnfTTgJ5+2IyJqJayavTvZgNKaDcQ2MXesVwAbdDezXzF2AXLttMzxFfMy+5292Gch83ACMkl7T5rDi0jBwubyTGWAhMuBC4eBEnS2nQpQ+KIXkeLFveeig90hpjPzwPFIB58Axi06RbJtyGVDcC8/r4ZvSgUaG+S51DyxfaML73CacLZxZ6wZJM87FT0BNORDtrr0PJ3ftnDrxrHM7YxeD/zJDnP7YE+a+fCGFmKGn/80RT/4apbPJ8qDs27Y4DMuNCdj9+5nCVpu2bp0jC3yeQuRMSnPjV8Wpfjt/epNv63nkFYluGvdA7NzkdA0Tz9sWSh3VytPKZzRmJ8DQys342iGMskvnDNH83xFw2xHJXoxozGDwO2iJQ/g0s6p+fNuFY+wVZGFqIe/IPGbXUA6MAYBP2+OyVwPpdBp3MlOedWpEqyMH7gCrJfIImpN09ruY+Pq/9VZD19/gRpkrVNY+r4ICdc5Ol4aQVO1r81B433Lc4OdttP89ACVj0xYvEe1eW+WGIUa+LhpwnCHAY4s9gADnfY17xXNNtoh32hxHi7uc3MXhlJZRWmA9DMRTA4V9Gx8acUyBeNYf/hwShFSahJcZxDrBp69p2aP`
- ORD: `37v/D43IUswQApy/qL5zTmG9Z2dAsYHBm2ZBT5/dQd93xZ6cRAoZR2x9VbrdxrsAouYNCEVaqRUNsMTq6eYXfIpU0mrVqSRtRIDBG0yMp7Cdh/77ewiQbUC5MM0Ve3E8SSBxwEgEIK/beIDzWOyfRDSl8+0hkvXvdR9VqEYFIWWwdaQw1076Yb7AKB+f786maC1cXmojub5oN20EdGveJTTtLHB7G0KaBWIUnqTo3mwPdu5BIIrVnqzL+zX9u+rWY59DNZlOY4txaTqvtqJpnmF+k17xL6q0TYCToS/GT3cIHY7shlBg4ESAHuwkxojDur26exL4xu7zD+OWco8PZIh12s/Wc1dikPHOvcdbdjQfmTNEOfaRbOXpL2tRn6DBqHDHXIGeYAR9+uNBguI2e6oxxSp3mlJbtfK7ORDGPKNCoiAWHF1qLNAZVdG7b1BMGp5Pf1WtGu2cen3Ztu2VYFJVS66VNUr2AoXv+LN68olaY7DfIgyT7nLw9gOvMMw5fefGwRxwa7ax8nwNkvg/Mtnps3MteliKIfDjZA1fu18yjDZaKgK1MmjL6KzKgrWyn3k6lVz47bPYw0WIb9OkqJoXq3/iJtsCxBZGspeYXBl0vVPZ0Gat5jwQRJ2ZsfQCG7EIcW3K5oFbGXsfmIOupTOb4rJ0LVguxhGX/8R+WcOnFKA9oJtOJBKYbU+qsqDbjjq0Lgxm44ZLMvyPrM28ClYQyqaGdkcdcHOg8OBBJvr3TAHJq2PjX7WhUKRD++DrvrC2zauD5p8H7vAy0LXny9WQB66Uh7DbMNQpYlL69VX68hX3hri6Sd3yZwCB5xcWjJc0HIJ3wUH`
- ORD: `GlM2wSZsVk5LMCd8uVrAgrMyXELNU1W6Wur5kHoFSOz8NYIo4HooIGbTLWReZm0Ac1TFgBY+P5gfS47vkHAgmwPTSfsF5bmbwbUZW7iyIgqXgPuUND8BJZvu9lccC0w/7MLMMBKZtVqbgsPSMMnOQsIILPq2gl/LjbKMiTg2jvjOE39EVzi8oFRheJJwC2U7x77VxyAA+vIW0rBogX5b6CR0fhTUxY4stpNSlK3tcsakscP0QoizSCdYhke5cOuhODarMF9OQHisB1eIWracoXE7P7jkN81AQGAKwdYbN10BjxUhYRXZADmlcoSoPdjZBQPQfyT9YX9/U+ZwaEGWfK1ZLtn/qZqI9lQUnazhqK7dCC8Lhv6v5VHFh/1lAat0WReUbJdQQ1LWzXZQxFN5wusEyauWIpRhpbgsORDTkketgDyvxncCCy15YD84HmJ/j6m4Xc7YQWHoZAKrq0vK5wi5jiZ7fBthnrkLWQgUSf1kd7GbZhCojUKJ6hTwi+I+tn/nWpgs3huAQfhOh3rW6gl5wZgidCwrBVWgt08Th0tYJbuBBzLt8NjH4KCo4BfHefHtK8QxAGb5ttsM3y5o1WXArkSgyZlhQ8Nxvv1FrkiWMh6Zeqh6JO8iFK4j2qWceeZ7PCbyeB5GW4pnTAKH+Sa7kMlrNMbAST4ogRRS/kMPRfCopIVF19/ZFo0Q4RtHZt4Oq+VXbqYePZGi7J1Y1NSEcpNNqsjZ2VdnlzBZBiXVoE6NFxGZDJ+JKDFxincMBvUdYfMmBXKq33DyoAQrATmjIwLu3rqNracTFJJW2gi6x8uKA1xUZhXy6T3Tyvj4RLNR6o/7JH9`
- ORD: `Ws7YbZuCNcKUu7U3jft0lcfCwcyd1Y9c+g15eQrmSnEwcP3AGdxpDnDVdTN6ILG027R9akclyAKHf217dkK81zlK1olaGO7MlPDjzmBWLeK8i5Vpaa8WI0Yq7b+OM8Oed+52lRCWyqctZjQ+cvroXaYeWYDA69ZP4evwYdbTl2oy4uWQtb3oc+MB6JVtXU6jcGMV+LG2sgOQbGnuzv5TyMF7E41v/DeaqaMgwrk3OTgSSFbJ/aW9WudbSSluK57cO1xOqFUoe4a2oY4XnBRFqVLnraaonL+53IXgkXuccHoDqoyRl1rRLXyoTZUOloJ72X/ssELBMtbId3fF6x61nsOhZF4qB/UWQhnPcmbbL4sWlbIf9s256t7FNmi+kp0AJ86hFfPW4gjCJdv7ylKSamegFk21m4lE2w6EORD5wqaNrkqGOOgnPiOWXyAnL6v775/NsP/6Qz3OgaaN1k7Fe7TkIXKGnTMSwW+phytF3ry1Xopkionap3Qp/bcip/3hW8EYpuXbX9Cy3w1CaLHazVw07sdJOqNu/Tyfknx9eXBNCmiu1Y/0omr55ahUqk52YwEG4Kc/cTqwP4PMPm0Xn9WBzlD7lKIo3iqrXCkPh0V3/ghdUpT0pwLVt6HinN9wK2czzMR9IZ/ISDTEN2Hi+XU6ePqU32U5AHg36aqCrPH7YZbZci71fsPTlXKyUWcFTrFycj5hiMWgFkEldeaYvy3sv9JK+VbXQLml0WaChz7OztfiiFFLSVKR6KAG/NheMZnZ515omjRBb2VVyxEawymANsDIOSXHmgEn82zcLFIesvnLSC7PSDJeL+JWeBpEYxdvIzqahqN`
- ORD: `UjrhUPkwPyoLd9By8eQYCa9rwajDog9oqeu6b2zlQ5mERZiiFbkv9s2IXIodT2EMYmR/lUcTje634R2wNOTh5CpWp5uGwA4B7raoUW5zvf8zx/0vygCrcXkt3bg9+hltDOS9J567lzor5wyjsTkfJKt116331q72CPSjwn747yCf6hqt+C9bpv6eMIzdqVNpItFViu8awv1qBXcp1Bx87Cq4EIhlyYXBAr+rKGTTqOUO9ntSs/602Dt0+STxUABNuPIz3rd8fbI4sVwgHzu1eIuckx7nMCLNr+jo/MN0eAlER7bzY0BUH28Fsbpuhb21C71Y85nSDiufWytQPS7zg1vAutOC7DSPTcCNr65F6BR8DdVYd02gku/7lLFXgsXCKU+3ySMLHffUq54mF0+o1fLRDQKztqDix0zyORDYj8HNRn27WODMU+kxR/eJuY9JJeMaXB7EdOaQ5zA/+BEfCAE43TrjEaXYmQx22KftssZye7QRNNHOuKb3qDqwt+Z2j0i6ICuG8iSef2v63Ib4NGRzvO73b1VPKdFEWxABwVJ4bMBKcOhULBxCz2jM5WA2Ragu/ToOBwWJ5c/HMY+JAErf/YoLXyienTG/E+VZ0iz7RK6FkfsZgdoop33p2RpE/bTUnmhOpp1f0TjG9Rc7LW8yLJKq/XIi0+mbXnVAWvYZyq1oJLKIegpu/gphIEyUwK378YPcu/bAOioHD66GVziNdARGlhAhq3T2nngnCJzNSVFLtPX3fuAuGz5qDosZtPxNpikHskGDTNuthaiLTFvvldpTObyjtBDs9hoosUqPHmpLaebB/UEDUCWLD+9GgYCal0CAMbt`
- ORD: `8qKkcl5dpGSbbCOMBgBvE3I+fF6RaTVBRbdictH/QpNs9JuBP6IdsOoP3eFdMuMbYP0aDQLPb49Gzg6ReN5fD7hV0Vu4pd8o+TsKBsG084K3HSsUM7oZC9PKGw3NCG3Cpiq9OcGD1hAV79DALw4eXMEyLKxi0FdKBW15+xBylTejjp4+E+nZKX2PzGP4RJHOxCb/3D+04xEac0c24VAdPDwcX+oD1wr3TI7Yh3FuEhnW53XZENx6mqYF785ZeYGfVE6TDEdlfoge2IBE2PGd5m3kSOsApAaF4lR7RfaTaKwkY2tDIOOus4XruBUGGuq4TmAFpi+SM1++n6nJ/bRdnZWHltIt2w2mCI4l+CSfeBtbUDkLKQ9KfSSYthwCN/COz9lVhZXjkepDfW/WQ0k1oD3tkuh3zPg1lAmfORDSDBURyJrdx/+4bRtaac5MpMJJ1mM0Ghaa589IRi3QZkQEDhXehX1atFiIISom1+AYgQBW9ya0M3np2gSgIZlL3qvUKGcqTUabcAG3+QIBNBocWEptN4l4q33kauu+rj1tRvUPHFiWdMovyAzYSDh4A/wMFuYbc6xPCCXnVhZyk5yT9sjzVGrAEUPG9DuEwVip2OvsemJyohvbwEEp1YGbXePE05K4mHkHKNmTtmXQk6HMNQge1PrU7iCszNKHpCqZ4QYmrbaz7lgBl8+d1GqlW3g+XdfdHBocJJ0rMERIDr1KDaBM/OeV24Ln2k4V72hNLWDnBGfFUy37kEEvRIk8j0lBZVKNyE6uOr3FwurLHooRbkHmv1WjJ4kJien20t2feWSb8v3X8Bjyp1yQvhQNW4LC8W6K8KSzEHe`
- ORD: `QLz3/Fi+ZVXjcF+TWNEZCfgD8dGtLv++G5lMK/qy5Tk7YTHTQVJSl3zWEj2Rd/XvQkbn74MqMgJPnxQ6KDcEf+oZRVJRBAK+93s8qNku87J8YfCR1KaMfJE2pxraIpUYwMjaUXDeD0o//4jiF4/KGVU3PqjvTbLzp1L+rx9gIME94xDzLOuQK8k4umtgXFSNuVo2Rl56zFfP/37d8238/rkyaeAuYgJe1+hmBU5kkVEoUiPTe7hDIZt6fD+PaYKEkHwkg+v0rO50ktoiluutpaIgMFLgK7c3CpDu3LXAGoac1AJqcgdnAmDTpd9TwNyBriwLKGNBUjz0Vi5YLHHc2JZr6tm/999F1xdcbUYGtYua1o2JlZwKGr9vLLHXN2CVsXSGNWXQJfh5ziXYix4kPzhewbs2uKXlUmoaORDG6Hw5jvlZNxYyeF07xV47PW8v0CUJEE0aLOjs4zwGMveqisevfldMLitqcBGLsZGWG3gYfahesi+jBLjhfJVlRdFLIhiOz7MzWGN9xUplSn2HLILaqUIzaYOJdWMSPX+Ar8NcLDh/gUkCAc1rZ7Dw7/dK2JqEBte3i5pNNEaOeBIMFOROCEO+6RaRJRfP1eRJwenu+CfNFg9MGarJIESA0US7Zqw7xJl1kD5hX84B4K+LagZpgEesjzs6hLamJD1zPQ96MuMsZxzIgZbYy0Qw5KTFeM+COzAG69WB03h+3iLUJ6ZBkFKjsablbbIEvGxWPSysuhwITBUPjxoXgrBypOj/HfN81VCosGSov1tVA/Eq9o1bpHujk1j6xYw016CQeKwvJN8LmgDtr1SytU8ZZHFLPDGRiZ4NXrw`
- ATOM: `sj5UtABKO+VcovcuED2hqRvDynDq6v0Y/34Gj4TU11FhmBWIvyLfqKuBn+LVoLX2Fq9+jrJw37QO1hwUcFNxi5eYlzFon33oxB2SmJZoN+/e81/747lU6rIUHP+u/CrSoNQoNNT48VFAN43rAOLqJlmHonPdJchPhu6gEK7l3v78Fbn3ljqlZiwBOTon+TTOe0Llr0cL4KaPtOw9Ncfm6SUiG7KTvcBJRYpXAlGbRGQDU4kfIqzwcZZ/kOrXdeRiO4JDHioXuqcjQcY03Wyy4/vWf0mmbGyiH8nv9zUZBD6yK+61QzVOSIhdx7tXWB6i2LQoF2VvV4eP6wp//GQFjJDHMZaEKBgBj1zlv4AUdUYecsOBuPO10kgx6pXVQUpXuVsjR3QDYGGYiUYIp9eKxjwOiIGNrcKe8mjiATOMvVo60zK19TwDvMGsgcdAT/lkMxl0j3YnBvYJTxgC+I9dKMXqEp4T83KrYj1XccgafaPJZtU7y7QzOGl59Ft4yTQsv3ezl5bBMw58tQpHe25ywkbHj0BByChOaDATO9R5InfwaUUdkj+Go8A3fvhn/Rqy9eNtZwQn3JFz3ScYIT9w+yAbUhmPHuQ4gJy0mjyiKsMCcMpaFjfQQxd9redBEZg3kwpWVE/NdN/VB/axKARRn1kcB32miTSF3aKNSDHAr6ZdxVtHYFPoWRgd4PYctnqgZ2D1skkIhn1gHJUzDuB5klTMAZisMtB4p7JpwFyS3FvXp/g7UL77tl79slA0mV07BCHw4TvzQ5Sbu52g6hIAilv8p/BXtm2nm+edHtLiJTI96WqKaHQ/1g89T2ERs+gDMca7IUgNCjwk`
- ATOM: `ar e=PMAP[pk],W=e.win,cat={}; function ens(b,bk,c){var X=cat[b]||(cat[b]={});var Y=X[bk]||(X[bk]={});return Y[c]||(Y[c]={});} // 연간 누적(ann26/ann25) 포함 — 윈도가 존재할 때만(구 데이터 호환). cat atom 재사용이라 추가 데이터 없음. var PERS=['mtd26','mtd25','wkcur','wk25']; if(W.ann26&&W.ann25){PERS=PERS.concat(['ann26','ann25']);} PERS.forEach(function(period){var wd=winDays(W[period][0],W[period][1]); for(var yk in wd){var A=window.ATOM[yk];if(!A)continue;var days=wd[yk]; for(var b in A){var Ab=A[b];for(var bk in Ab){var Abk=Ab[bk]; for(var c in Abk){var cells=Abk[c],Z=ens(b,bk,c),arr=Z[period]; if(!arr)arr=Z[period]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; for(var j=0;j<days.length;j++){var v=cells[days[j]];if(v){for(var i=0;i<15;i++)arr[i]+=v[i];}}}}}} }); return cat;} function rebuild(pk){window.__PK=pk;D.cat=aggCat(pk); // T`
- PDET[: `(카드 클릭) ────────────────────────────── var PMG=[['온라인',['자사몰','무신사','외부몰','기타(온)']], ['샵인샵',['백화점','쇼핑몰','아울렛']], ['리테일',['직영점','면세점','위탁사']], ['기타',['대리점','기타(오프)']], ['해외',['해외 위탁','해외 사입']]]; function openProd(kk){ var c=window.__TM&&window.__TM[kk]; if(!c)return; var _p=kk.split(':'), which=_p[0], pn=_p[1]; var w=(st.period===1), rise=(st.toptab===1), pk=window.__PK; var pd=(window.PDET&&window.PDET[pn])||{srp:0,ch:{}}, ch=pd.ch||{}; var pp=(window.PDPER&&window.PDPER[pk]&&window.PDPER[pk][which]&&window.PDPER[pk][which][pn])||null; // VAT 기준 분리: 매출/실판매/할인율=채널별 VAT(원본, 면세·해외 ÷1.0) · 소진율(비중)·표 TAG=발주와 동일 ÷1.1 일괄 function isf(bk){return bk.indexOf('면세')>=0||bk.indexOf('해외')>=0;} function nt(bk,t){return isf(bk)?t/1.1:t;} // 소진율용 TAG(면세/해외를 ÷1.1로 재환산) // 누계: 실판매·raw TAG(할인율용) + 정규 TAG(표·비중=`
- PDPER[: `ue;var days=wd[yk]; for(var b in A){var Ab=A[b];for(var bk in Ab){var Abk=Ab[bk]; for(var c in Abk){var cells=Abk[c],Z=ens(b,bk,c),arr=Z[period]; if(!arr)arr=Z[period]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; for(var j=0;j<days.length;j++){var v=cells[days[j]];if(v){for(var i=0;i<15;i++)arr[i]+=v[i];}}}}}} }); return cat;} function rebuild(pk){window.__PK=pk;D.cat=aggCat(pk); // TOP10은 renderTop이 PDPER[pk]에서 직접 계산 var e=PMAP[pk],inf=document.getElementById('annInfo'); if(inf){var W=e.win;inf.textContent=(e.kind==='close'?'마감 ':'당월 ')+W.mtd26[0].slice(5)+'~'+W.mtd26[1].slice(5) +' · 주간 '+W.wkcur[0].slice(5)+'~'+W.wkcur[1].slice(5)+' · 전년 동기 매칭';} renderAll();} var st={brand:0,period:0,season:0,chsel:{},stab:0,toptab:0,exp2:{},sortKey:'실적',sortDir:-1}; function brandsSel(){var b=C.brands[st.brand][2];ret`
- PDPER[: `,which){ // 연간 누적(st.period===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=PMAP[window.__PK]||{}, acm=pkE.acm; var base=(window.PDPER_ANN&&window.PDPER_ANN[acm]&&window.PDPER_ANN[acm][which])||{}; // 연간 = 완료월 누적(base=PDPER_ANN[acm]) + 진행 부분월(당월 PDPER, 주간기간만) → 1/1~현재 var addCur=(pkE.kind==='wk')?((window.PDPER&&window.PDPER[window.__PK]&&window.PDPER[window.__PK][which])||{}):null; pd={}; for(var _pn in base){var bb=base[_pn];pd[_pn]={};for(var _bk in bb)pd[_pn][_bk]=[bb[_bk][0],bb[_bk][1],bb[_bk][2]];} if(addCur){for(var _p2 in addCur){var cc=addCur[_p2];if(!pd[_p2])pd[_p2]={}; for(var _b2 in cc){var cv=cc[_b2];if(!pd[_p2][_b2])pd[_p2][_b2]=[0,0,0]; pd[_p2][_b2][0]+=cv[0];pd[_p2][_b2][1]+=cv[1];pd[_p2][_b2][2]+=cv[2];`
- PDPER[: `od===2)=완료월(acm)별 PDPER_ANN(단일윈도 3값). 그 외=기간 PDPER(월·주 10값). var MM=1e6, PM=window.PMETA||{}, ann=(st.period===2), pd; if(ann){var pkE=PMAP[window.__PK]||{}, acm=pkE.acm; var base=(window.PDPER_ANN&&window.PDPER_ANN[acm]&&window.PDPER_ANN[acm][which])||{}; // 연간 = 완료월 누적(base=PDPER_ANN[acm]) + 진행 부분월(당월 PDPER, 주간기간만) → 1/1~현재 var addCur=(pkE.kind==='wk')?((window.PDPER&&window.PDPER[window.__PK]&&window.PDPER[window.__PK][which])||{}):null; pd={}; for(var _pn in base){var bb=base[_pn];pd[_pn]={};for(var _bk in bb)pd[_pn][_bk]=[bb[_bk][0],bb[_bk][1],bb[_bk][2]];} if(addCur){for(var _p2 in addCur){var cc=addCur[_p2];if(!pd[_p2])pd[_p2]={}; for(var _b2 in cc){var cv=cc[_b2];if(!pd[_p2][_b2])pd[_p2][_b2]=[0,0,0]; pd[_p2][_b2][0]+=cv[0];pd[_p2][_b2][1]+=cv[1];pd[_p2][_b2][2]+=cv[2];}}} } else pd=(window.P`
- PDPER[: `which])||{}):null; pd={}; for(var _pn in base){var bb=base[_pn];pd[_pn]={};for(var _bk in bb)pd[_pn][_bk]=[bb[_bk][0],bb[_bk][1],bb[_bk][2]];} if(addCur){for(var _p2 in addCur){var cc=addCur[_p2];if(!pd[_p2])pd[_p2]={}; for(var _b2 in cc){var cv=cc[_b2];if(!pd[_p2][_b2])pd[_p2][_b2]=[0,0,0]; pd[_p2][_b2][0]+=cv[0];pd[_p2][_b2][1]+=cv[1];pd[_p2][_b2][2]+=cv[2];}}} } else pd=(window.PDPER&&window.PDPER[window.__PK]&&window.PDPER[window.__PK][which])||{}; var bks=chans(),bs={};for(var i=0;i<bks.length;i++)bs[bks[i]]=1; // 선택 버킷 집합 var wantB=(brand!=='통합')?brand:null; var out=[]; for(var pn in pd){var meta=PM[pn];if(!meta)continue; var pb=meta[6]; if(wantB&&pb!==wantB)continue; var e=pd[pn],ms=0,mt=0,mq=0,ws=0,wt=0,wq=0,pm=0,pw=0,pmq=0,pwq=0,hit=false; for(var bk in e){if(!bs[bk])continue;var v=`
- PDPER[: `; for(var _pn in base){var bb=base[_pn];pd[_pn]={};for(var _bk in bb)pd[_pn][_bk]=[bb[_bk][0],bb[_bk][1],bb[_bk][2]];} if(addCur){for(var _p2 in addCur){var cc=addCur[_p2];if(!pd[_p2])pd[_p2]={}; for(var _b2 in cc){var cv=cc[_b2];if(!pd[_p2][_b2])pd[_p2][_b2]=[0,0,0]; pd[_p2][_b2][0]+=cv[0];pd[_p2][_b2][1]+=cv[1];pd[_p2][_b2][2]+=cv[2];}}} } else pd=(window.PDPER&&window.PDPER[window.__PK]&&window.PDPER[window.__PK][which])||{}; var bks=chans(),bs={};for(var i=0;i<bks.length;i++)bs[bks[i]]=1; // 선택 버킷 집합 var wantB=(brand!=='통합')?brand:null; var out=[]; for(var pn in pd){var meta=PM[pn];if(!meta)continue; var pb=meta[6]; if(wantB&&pb!==wantB)continue; var e=pd[pn],ms=0,mt=0,mq=0,ws=0,wt=0,wq=0,pm=0,pw=0,pmq=0,pwq=0,hit=false; for(var bk in e){if(!bs[bk])continue;var v=e[bk]; ms+=v[0];mt+=v[1`
- PDPER[: `부몰','기타(온)']], ['샵인샵',['백화점','쇼핑몰','아울렛']], ['리테일',['직영점','면세점','위탁사']], ['기타',['대리점','기타(오프)']], ['해외',['해외 위탁','해외 사입']]]; function openProd(kk){ var c=window.__TM&&window.__TM[kk]; if(!c)return; var _p=kk.split(':'), which=_p[0], pn=_p[1]; var w=(st.period===1), rise=(st.toptab===1), pk=window.__PK; var pd=(window.PDET&&window.PDET[pn])||{srp:0,ch:{}}, ch=pd.ch||{}; var pp=(window.PDPER&&window.PDPER[pk]&&window.PDPER[pk][which]&&window.PDPER[pk][which][pn])||null; // VAT 기준 분리: 매출/실판매/할인율=채널별 VAT(원본, 면세·해외 ÷1.0) · 소진율(비중)·표 TAG=발주와 동일 ÷1.1 일괄 function isf(bk){return bk.indexOf('면세')>=0||bk.indexOf('해외')>=0;} function nt(bk,t){return isf(bk)?t/1.1:t;} // 소진율용 TAG(면세/해외를 ÷1.1로 재환산) // 누계: 실판매·raw TAG(할인율용) + 정규 TAG(표·비중=소진율용) var TSALE=0,TTAGr=0,TTAGn=0,TQTY=0; for(var k in ch){TSALE+=ch`
- PDPER[: `'샵인샵',['백화점','쇼핑몰','아울렛']], ['리테일',['직영점','면세점','위탁사']], ['기타',['대리점','기타(오프)']], ['해외',['해외 위탁','해외 사입']]]; function openProd(kk){ var c=window.__TM&&window.__TM[kk]; if(!c)return; var _p=kk.split(':'), which=_p[0], pn=_p[1]; var w=(st.period===1), rise=(st.toptab===1), pk=window.__PK; var pd=(window.PDET&&window.PDET[pn])||{srp:0,ch:{}}, ch=pd.ch||{}; var pp=(window.PDPER&&window.PDPER[pk]&&window.PDPER[pk][which]&&window.PDPER[pk][which][pn])||null; // VAT 기준 분리: 매출/실판매/할인율=채널별 VAT(원본, 면세·해외 ÷1.0) · 소진율(비중)·표 TAG=발주와 동일 ÷1.1 일괄 function isf(bk){return bk.indexOf('면세')>=0||bk.indexOf('해외')>=0;} function nt(bk,t){return isf(bk)?t/1.1:t;} // 소진율용 TAG(면세/해외를 ÷1.1로 재환산) // 누계: 실판매·raw TAG(할인율용) + 정규 TAG(표·비중=소진율용) var TSALE=0,TTAGr=0,TTAGn=0,TQTY=0; for(var k in ch){TSALE+=ch[k][0];TTAGr+=ch[k`
- PDPER[: `], ['리테일',['직영점','면세점','위탁사']], ['기타',['대리점','기타(오프)']], ['해외',['해외 위탁','해외 사입']]]; function openProd(kk){ var c=window.__TM&&window.__TM[kk]; if(!c)return; var _p=kk.split(':'), which=_p[0], pn=_p[1]; var w=(st.period===1), rise=(st.toptab===1), pk=window.__PK; var pd=(window.PDET&&window.PDET[pn])||{srp:0,ch:{}}, ch=pd.ch||{}; var pp=(window.PDPER&&window.PDPER[pk]&&window.PDPER[pk][which]&&window.PDPER[pk][which][pn])||null; // VAT 기준 분리: 매출/실판매/할인율=채널별 VAT(원본, 면세·해외 ÷1.0) · 소진율(비중)·표 TAG=발주와 동일 ÷1.1 일괄 function isf(bk){return bk.indexOf('면세')>=0||bk.indexOf('해외')>=0;} function nt(bk,t){return isf(bk)?t/1.1:t;} // 소진율용 TAG(면세/해외를 ÷1.1로 재환산) // 누계: 실판매·raw TAG(할인율용) + 정규 TAG(표·비중=소진율용) var TSALE=0,TTAGr=0,TTAGn=0,TQTY=0; for(var k in ch){TSALE+=ch[k][0];TTAGr+=ch[k][1];TTAGn+=nt(k,ch[k][1]`
- ATOM[: `ar e=PMAP[pk],W=e.win,cat={}; function ens(b,bk,c){var X=cat[b]||(cat[b]={});var Y=X[bk]||(X[bk]={});return Y[c]||(Y[c]={});} // 연간 누적(ann26/ann25) 포함 — 윈도가 존재할 때만(구 데이터 호환). cat atom 재사용이라 추가 데이터 없음. var PERS=['mtd26','mtd25','wkcur','wk25']; if(W.ann26&&W.ann25){PERS=PERS.concat(['ann26','ann25']);} PERS.forEach(function(period){var wd=winDays(W[period][0],W[period][1]); for(var yk in wd){var A=window.ATOM[yk];if(!A)continue;var days=wd[yk]; for(var b in A){var Ab=A[b];for(var bk in Ab){var Abk=Ab[bk]; for(var c in Abk){var cells=Abk[c],Z=ens(b,bk,c),arr=Z[period]; if(!arr)arr=Z[period]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; for(var j=0;j<days.length;j++){var v=cells[days[j]];if(v){for(var i=0;i<15;i++)arr[i]+=v[i];}}}}}} }); return cat;} function rebuild(pk){window.__PK=pk;D.cat=aggCat(pk); // TO`
- sell: `erKpi(){ var reps=C.rep[C.stabs[st.stab]]; var totS=saleOf(catSum(C.allcodes,pcur())); var h=''; for(var r=0;r<reps.length;r++){var rep=reps[r]; var cur=catSum(rep.codes,pcur()),py=catSum(rep.codes,ppy()); var s=saleOf(cur),sp=saleOf(py),tg=tagOf(cur),q=qtyOf(cur); var yoy=sp?s/sp-1:null,disc=tg?1-s/tg:null,aov=q?s/q:null,comp=totS?s/totS:null; var od=ordSum(rep.codes),dd=ordV(od,0),mt=ordV(od,3),sell=dd?mt/dd:null; h+='<div class="k6"><div class="k6t">'+rep.label+(rep.sub?' <span class="k6sub">'+rep.sub+'</span>':'')+'</div>' +'<div class="k6v">'+m(s)+'<small>백만</small></div>' +'<div class="k6g"><span>판매율 <b>'+pct(sell)+'</b></span><span>YoY '+chip(yoy)+'</span></div>' +'<div class="k6g"><span>할인 <b>'+pct(disc)+'</b></span><span>객단가 <b>'+(aov==null?'—':won(aov)+'원')+'</b></span><span>비중 <b>'+pct(c`
- sell: `ur),sp=saleOf(py),tg=tagOf(cur),q=qtyOf(cur); var yoy=sp?s/sp-1:null,disc=tg?1-s/tg:null,aov=q?s/q:null,comp=totS?s/totS:null; var od=ordSum(rep.codes),dd=ordV(od,0),mt=ordV(od,3),sell=dd?mt/dd:null; h+='<div class="k6"><div class="k6t">'+rep.label+(rep.sub?' <span class="k6sub">'+rep.sub+'</span>':'')+'</div>' +'<div class="k6v">'+m(s)+'<small>백만</small></div>' +'<div class="k6g"><span>판매율 <b>'+pct(sell)+'</b></span><span>YoY '+chip(yoy)+'</span></div>' +'<div class="k6g"><span>할인 <b>'+pct(disc)+'</b></span><span>객단가 <b>'+(aov==null?'—':won(aov)+'원')+'</b></span><span>비중 <b>'+pct(comp,0)+'</b></span></div>' +'</div>';} document.getElementById('bokKpi').innerHTML=h; var sub=document.getElementById('bokKpiSub'); if(sub)sub.textContent=perLbl()+' · '+C.stabs[st.stab]+' 대표 복종'; } // TOP10 — PDPER 버킷별 실판`
- sell: `tinue; var e=pd[pn],ms=0,mt=0,mq=0,ws=0,wt=0,wq=0,pm=0,pw=0,pmq=0,pwq=0,hit=false; for(var bk in e){if(!bs[bk])continue;var v=e[bk]; ms+=v[0];mt+=v[1];mq+=v[2]; // 연간=[a_sale,a_tag,a_qty] / 그외=월값 if(!ann){ws+=v[3];wt+=v[4];wq+=v[5];pm+=v[6];pw+=v[7];pmq+=v[8]||0;pwq+=v[9]||0;} hit=true;} if(!hit)continue; out.push({pn:pn,yy:meta[0],sg:meta[1],cat:meta[2],sell:meta[3],od:meta[4],oq:meta[5], iq:meta[7],sq:meta[8],cost:meta[9],enm:meta[10], // 순입고·누계판매수량·원가단가·ERP상품명 iv:meta[11],wiv:meta[12], // 매장·창고 가용재고 brand:(brand==='통합'?pb:null), m:[ms*MM,mt*MM,mq],w:(ann?[ms*MM,mt*MM,mq]:[ws*MM,wt*MM,wq]),ps:[pm*MM,pw*MM],pq:[pmq,pwq]});} return out; } function renderTop(){ // 연간 누적(annP)=PDPER_ANN(완료월별 연간 원`
- sell: ` +'<div class="tc-main"><span class="tcm-lab">'+(rise?'증분':'실적')+'</span><span class="tcm-val">'+(rise?('+'+won(c._inc)+'<i>장</i>'):(m(s)+'<i>백만</i>'))+'</span></div>' +(rise ?'<div class="tc-rr tc-rr-stk"><span>판매<small>당기</small></span><b>'+won(q)+'<small>장</small><em class="tc-prev">직전 '+won(w?c.pq[1]:c.pq[0])+'</em></b></div>' +'<div class="tc-rr"><span>판매율<small>누계</small></span><b>'+pct(c.sell)+'</b></div>' +'<div class="tc-rr"><span>실적</span><b>'+m(s)+'<small>백만</small></b></div>' +'<div class="tc-rr"><span>할인</span><b>'+pct(tg?1-s/tg:null)+'</b></div>' :'<div class="tc-rr"><span>발주</span><b>'+won(c.oq)+'<small>pcs</small></b></div>' +'<div class="tc-rr"><span>판매</span><b>'+won(q)+'<small>pcs</small></b></div>' +'<div class="tc-rr"><span>판매율<small>누계</small></span><`
- sell: `iv>' +'<div class="tc-rr"><span>실적</span><b>'+m(s)+'<small>백만</small></b></div>' +'<div class="tc-rr"><span>할인</span><b>'+pct(tg?1-s/tg:null)+'</b></div>' :'<div class="tc-rr"><span>발주</span><b>'+won(c.oq)+'<small>pcs</small></b></div>' +'<div class="tc-rr"><span>판매</span><b>'+won(q)+'<small>pcs</small></b></div>' +'<div class="tc-rr"><span>판매율<small>누계</small></span><b>'+pct(c.sell)+'</b></div>' +'<div class="tc-rr"><span>할인</span><b>'+pct(tg?1-s/tg:null)+'</b></div>') +'</div></div>';} return '<div class="topblk"><div class="topbt">'+title+'<span class="topbt-sub">'+sub+'</span></div><div class="topgrid">'+(cells||'<span class="c-na">— 데이터 없음</span>')+'</div></div>';} var seas=C.seasons[st.season], per=(annP?'연간 누적':(w?'주간 누적':'당월 누적')), pl=(w?'전주':'전월'); window.__TM={}; w`
- sell: `||(gCt<=0&&gPt<=0&&gCq<=0))continue; rows+=trow('pm-g','<span class="pm-car">▸</span>'+gname+' TTL',gCq,gCt,gPq,gPt,' data-pg="'+gi+'"')+subs;} // ── 요약 블록 = 상품 대시보드 상품 모달과 동일 구성 ── // 히어로(기간 실적 + 누계 실판매 서브 + 할인율/판매 기간) / 지표 6칸(발주·순입고·판매누계· // 판매율누계(+입고 판매율)·할인율누계). 급상승 탭만 hero 를 증분 수량으로 바꾸고 '직전' 칸 추가. var iq=c.iq, cumQ=(c.sq!=null?c.sq:TQTY); // 순입고·누계판매 수량(PMETA=상품 대시보드와 동일 원천) var sellIn=(iq?cumQ/iq:null); // 입고 판매율 = 누계판매 ÷ 순입고 // 전체재고 = 매장 가용(SW_SHOPINV.AVAILQTY) + 창고 가용(SW_WHINV.AVAILQTY) — 상품 대시보드와 동일 기준 var tiv=(c.iv!=null||c.wiv!=null)?((c.iv||0)+(c.wiv||0)):null; // 순입고가 있으면 항상 표기(값이 같아 보여도 숨기지 않는다 — 상품 대시보드와 동일 규칙) var sellInSub=(sellIn!=null)?'<span class="mbd">입고 판매율 '+pct(sellIn)+'</span>':''; var bigLab=rise?('직전比 증가 · '+per):(per+' 실적'); var big`
- sell: `hero 를 증분 수량으로 바꾸고 '직전' 칸 추가. var iq=c.iq, cumQ=(c.sq!=null?c.sq:TQTY); // 순입고·누계판매 수량(PMETA=상품 대시보드와 동일 원천) var sellIn=(iq?cumQ/iq:null); // 입고 판매율 = 누계판매 ÷ 순입고 // 전체재고 = 매장 가용(SW_SHOPINV.AVAILQTY) + 창고 가용(SW_WHINV.AVAILQTY) — 상품 대시보드와 동일 기준 var tiv=(c.iv!=null||c.wiv!=null)?((c.iv||0)+(c.wiv||0)):null; // 순입고가 있으면 항상 표기(값이 같아 보여도 숨기지 않는다 — 상품 대시보드와 동일 규칙) var sellInSub=(sellIn!=null)?'<span class="mbd">입고 판매율 '+pct(sellIn)+'</span>':''; var bigLab=rise?('직전比 증가 · '+per):(per+' 실적'); var bigVal=rise?('+'+won(incQ)+'<i>장</i>'):(m(bigS)+'<i>백만</i>'); var mets='<div><span>발주수량</span><b>'+won(oq)+'<small>pcs</small></b></div>' +'<div><span>순입고</span><b>'+(iq!=null?won(iq)+'<small>pcs</small>':DASH)+'</b></div>' +'<div><span>판매<small>누계</small></span><b>'+won(cumQ)+'<sm`
- sell: `량으로 바꾸고 '직전' 칸 추가. var iq=c.iq, cumQ=(c.sq!=null?c.sq:TQTY); // 순입고·누계판매 수량(PMETA=상품 대시보드와 동일 원천) var sellIn=(iq?cumQ/iq:null); // 입고 판매율 = 누계판매 ÷ 순입고 // 전체재고 = 매장 가용(SW_SHOPINV.AVAILQTY) + 창고 가용(SW_WHINV.AVAILQTY) — 상품 대시보드와 동일 기준 var tiv=(c.iv!=null||c.wiv!=null)?((c.iv||0)+(c.wiv||0)):null; // 순입고가 있으면 항상 표기(값이 같아 보여도 숨기지 않는다 — 상품 대시보드와 동일 규칙) var sellInSub=(sellIn!=null)?'<span class="mbd">입고 판매율 '+pct(sellIn)+'</span>':''; var bigLab=rise?('직전比 증가 · '+per):(per+' 실적'); var bigVal=rise?('+'+won(incQ)+'<i>장</i>'):(m(bigS)+'<i>백만</i>'); var mets='<div><span>발주수량</span><b>'+won(oq)+'<small>pcs</small></b></div>' +'<div><span>순입고</span><b>'+(iq!=null?won(iq)+'<small>pcs</small>':DASH)+'</b></div>' +'<div><span>판매<small>누계</small></span><b>'+won(cumQ)+'<small>pcs</sm`
- qty: `fph0bCVoxFGZQJ6XkJWP4KRjvVUdcxigb3/mJcHYTQ48ABcP8P6CflLhcsBBqGuCV8//T9qb7UiaI0uaL2QNcF8uK6NyEKisngxUxGBw6v0fZJyq5M9FRWkWPQ2cvsgodzf7F1KpKvIJCi/i+U5kacLvmEEfJNT26KF8gsISLR81SKeHTrZ2/7yYVEaWqYngS1J0U3XltE407K/Q13+0tgCBA4bBKyUUVY7uA9pHxOSJvLtOT0rgtMFtFbVbhjpS4gUDYpaBhOyrqJsKkh8XOXjoDboQhe2bI9KqlHjyyuDl4TVMhJ9E6B3BHR89t9xoast0vWnwYLfJXjiIKDuVlsbzhWOFft2qYJuB26khgVoT20urdJyo7rMPQ408/447sXVHXWcduBvOUUh1gxwHETWAmuuyckpToQOPqtyc3FZeeR4dZ/CQr7ltok0Jggi5leK5laJ1M7QnIeNebcsjIcNEUYyzZWW0SRKo86SMaJfXJ9D7siNVZD/z8eg2SlQNQ2cE/XmEDPmk6PJthmtbvWoYfuctpMja9qBu9SFAo7KSo5VOAoqXRzJ0FB5px5llcThat6edQ26yjJQxrBVM9Ub2+FRkOgptVzQnvrksJuJ6UbOCClWTjM4+ckuOSgO2R5y+jjTz/lEwfGYRP+lVDbrpNEJPlXs8Wwtz/D+A/u1luqPmSazKdU7a2mxh6EUf8UlhJSdMLp45k7FRlsssNdAXBAVFVS6I+4YeUFP6UrbsKTVgBGp8gQ3FTD/OKbyenDAQzlvBMZI+DvZV5ZfClo3a4MzfWLHuFTa1VpCNXoNpIyM2S0DGHlKHUTAE3n9sd9YGNLp+mg/`
- qty: `kjGWsJLxrCNpONSECgIEqz61/Ki/jeT24XmbiNWkIQHZpbhS+YaAgqFcB9aYQliFt9I7LvdiIn3XqWhBkFM6xx5LSbWnRDvEYgIPS0gklnwuX9LiBkfKK02raCCOwSxZ9SWepoHxgRn5ezgCRWUtG5IP/fVhqVDyBqIreSh3/j3hAohPMoKDnYWydRpqp2sEHMEwl3Y5PEPLqRGiP5AkYYclwhrSQcJhtQf5Q2lnXAgqFMzgL1yTkTFmW21lNi0kfCkEtWTgLtd4JBSTNG87XwSAQDt0fOJWl0c8RTkWphJW6mHtq7iDl4/0VqyAECgv9B7y+PHe7LatOBL1xSBCocHJc4rUTYeT2lCr8a39pp9xTbkU3MhDBIDGwzi1MpbMQbp2uTfHISOebSYxAFwS0ynt9IelOkACE6pIqtySmIFh0dNIh/e1oITj4/iYqCfy/DEbO2Nv5ssDwX2+ScDJ2sWbfQZ/O3xTkMqZcedGpwiCbsY+HBOp20JFO5iXsfuzxvAFqk1qPylFbgyh3kGbSLXBggZ0MX9YHzIAYJHMSnmjjy4rN0ChjxcDUoBgcquChCc7QvO+w90+EHoWVHyLwl9Ca0gSTQFNFIBv+NAZky3lWfSOkvRPhVwAeT/H1Gfcd4BUjlc8DSWGN900halvLaKcCwoSD0PgKX+AhSICDL7wKwM1v7vBwnJ0ltNZ9YIweru41vXI1TC7yAOCgGs/Xh31g+QtB/k/CteqkZiTyuMFqCh4oCUSiNZD95+PzWoaFESveP2yrrKb6OlIrd7eaY23bVSrQIoCeIrDAcfIDhV1PiAEWYWGJ5Svn7Xwh+/siIscFCfSnN3`
- qty: `omkCQ3t0wbrntZ8amRQlWZd1c4/KkyxniuYM4iMvv5nwZQLTSI3CrzeJwbMmHDN6XmkzXa30twqJoQlUp6AumzRz9EJiujLd4JAPJQsQ9GfaG117BsmD5qpsFZlPZhg3ZmMY3cIz5Luk2yBFA1vG+VPFR03SynbxLjN0p2acebJIoUFt5FYWfQUt1RIAkn2w464IY+kpVGfBRJqvZErhGGKL4nhzqv2ACj6p+vvP6pFfpafOT5Co4grTpMmDqQWWTVCVu3j12/c2QWGQ5FjciwJ95KCNThnzN1ZkqyREKo4mtuE0X0h3Tu3j/a+lt/TQsEjSo+siKKGxfpdin7B0nwShHfvLKW00MbEGmn4LsBiUuHxlsFW1defcJkJZWn7pS4ADyMHDRnW+CNlaZ12hLugxyd98/soPtl1jqtyUsTOGO6oLCHwSHW/742ZT25e8QKCfQGDLJ3i1CPRgOe4+BaByaOH09NWZuLpLyDwaRPbbdlVJaLDF2l8I5EQacBjviGFe4CBuS7rVe4YLHTwJfDlvHjWgE74sIv5Cuuk0rkSqV02NBFHd+ext6oIZqTHJari0NQg1doW8LRyHfiQV5LvoJtYQOwIQuasWqZzJAhU+/acTiB0V28fy3RW8vhxkEmWpziHHAiLeYXoY6WzrNULtN/oCUzaxMrpU0Jj/hW02efRV/SDH3dobZDh0CAbpN+lUnsMKFdjK76fa+Z7yPf2gzC/m6ilxDXGxSJd1cOa2fptJylOUkFFIg2ajEV5iidn2t/4Ujsul7AJ2VcVX+bTzOBTf8CTz7dclz5IJNmJo2dyy8Cd1CM0HBLs3zKz/8sgqk43moI4`
- qty: `Glrn32Fye0KYWIHqjqSaBZjxtuhStnEkHBim/3gfNFaZVAlZ5FuCZaTZmmjGwwPLemijMaD+6q63Y0OFJQB+xugS33CrQk5nzqM06JropWsadEccWXuDRlIw8weiMXDTPk2udQn3WngDs/owZwefRrWmuMzzqtSH3vAuKJz1wyI5+wenvOI+0rEZQocjkIYRCuQIdmRdajQ02eE738X4SNZB0GxWee5FdOBqhDDujyW4KEPWqoX+DWmtCVMONucCIXa3uciOTv/PdG/5VQcUUfJjXPvK1BT8XZCbxTTouS4GGPHpE+I/cB2LMN+2ms2H2HjA1+lVAzEkTOC/Z9SMWYc5ImhYpAsvoSkdCpx1khLWVny18zHTi0YhYRJDe8JHxQfVrEon7IH3kVbKEAtKmihF3sAxuKWICLRbqty8htOed9vno/J1iqie7gOWR0ihmbhf+0kOjs6E37khIQEDvegLWkPbnVEVlRq7C4U9HvjCo/f579KgdasoZA0K8YhcD9KgZIMCs1Y/rOO6ZR04AxVsTGVqcYqQ7L0KCyBtFs+YlidzOUScIQy7SGvcAPLdRULEgyoxeNAgbPoGRC08RrWKjE0BkfCY4VQ5ud6AEFK+qMcAFxnPJVYaHDUk6aaLyvoAm7CgoYW6jCrWggOPjbNEkMa6rZPbaavlwx8aq0obxcWfdnaOLLRTfLdK9ZL/SqEigipCM43n33eQXozofLwT1HDKvlHMVvBYFufI6GopP7KYONai/hA63Nz9flCcXRD6VCfeXcdCuwyZxq46qDYLwZCrCYE0a5lIJtOelyHWdlr9q0R2Rg6Y1Ykmg7RrU6kRuf8W+PS`
- qty: `pPcvJcPqYB22rOvVWwoPEsx6sBsP8aShSI9q6Hs5/IVMX+UciRkW3B3K+VaDZHuaUeF0OupI2RLqAvU1uqB5S5HEyOyC7sipvzMfs7fxx6TfKuiKOK45Ty2PfJ8IbYJ1ORXQ1E3ZCv4U23BSC6S5QbCWBdJqSXC6dTIFFAYuS5k310n84zdMEbAy0nUv8KcM3cfWkkyDKWTsaQSldikOZaRBUVVToYsIcnY7k2huz7CDAZFMZd5+k40npaf6h9gBFsB9N6jhX78ncBPSgUx5EXNxKxikDTBzjiKR8QAtJbHbk7sK3b98z89Db4nLJJH4uvoDErWUMcmiARdfd0UWgABEOFuoE3kU4nLty0fi6SeV6X5IpwthBD8j26b1QXkKEcBdVXd594Hn8iHK9ttfLMM5S9taEwUBEtrbqty3dAE9W7yQLDHSe0M5HAMF0FujzG7zZITKBWOS53mdnJfUfPl7VXgf6NyrkzO5eVHgop6JwdBpcmb86Tol8m5JUeK95g7RHLZ+zTx/BFevR4sK87I/yHHtibyYjgcFJ+xkyrszm41xYhVt98/Mi0kR5LZEZXTH1uJNWlATSH3glBsUjAeYod1BkaRaalJeO8iQT2S0nvcu0leU0KZg4IseZmBiXF+EtWw+2PribnInFGT2+x3hEQgz6nf0XbYIOHYkbC9/iGc/TdT87YJ9ylDmZtdfWuI/flqSiHGFN/CU7a4AWMbydrbAgGCVitqAM+oy5uWzaVJAvxrXrI/bec6NHypLyRr2ubNEqDIasXxN48nZ3PURkTBvBZRih87lHYmUZIPzvuGSTWJ29M442Ja5PW/821/F4Q09IcG`
- qty: `AgAfz7iS8gmxUhRalfvKWEA4K067PqY/+c1FyzE5nTDIAc3znFkMASi4fZjVffzK3ggDr0UParQwXt5rRF8UH3/CTSrwFQYEwHH6gvWOUj3zf2X7fsYBL6p14z2HnCXvmjLNVDu38HZmGJGI4Ci7r62StDWDUKMC1Q9AncVg3kI3ukOMnUwv1yqeorqLH2i6zTCLsydrJ1xyfzfgWtmpYRV0bNriI1Jw00dpTH0FTQg65Vtd5Tq/DsxoMiBVG/GOEAbdIDHGXZEqPTzYWVlBO4uNFeHrGLaIZpGYGJkqhNHuuJnUlAyOQuEptWtKL8vtX/RS6Q/DGG7nOlaULLwpa8HJt5UAyju11YtUPsLLBQurhlNH9JX28I+RvE4WjTBCDI84HsBR611vyfK254XwjXaRf2UlCE9+Dy/LqtyoWzaQNs2CBBExzciu/Sky95W/cBsLp/Xn1EG7FDEDr4gGz0mxo6E4gf8+8/u/9C8KeWQk3DH9UBWfGLNU/vvPhTzz/+h/f/22RRDLqqTwmAmUdmHhUVAYyCC1ilJORoihW2ujeL2QiuIHgbD4/ZX8C7DgLFgV5YzJcaSu3OOJb6wHNKR5DR/D87NKQBEKUo5slIWiFrYi+EPpbDRYycNA/E5GGR1G7Hf/r/xWzyAf4HJHb0UNmJmI4/WIGDQAasCqItRm9R6Sx6Alo1kCTS0/Lx5UvlCWJ3n6K/Yn6krZkGNO/LMjRygMZCJkuWKKFYBr2BPkReamfnyCdEHW+WJRQ71CBrbDfvxb69Mxz0Y54tK4Ndzy4Zlqhmz5c0JShXaGq6P8JjHPyebQgSUwlQG1eFUGEP7rmpbZITq`
- qty: `hX1A9T5cRyHb98klOTWbHagywZTYnKafG/onlJgQ1yat3fgeIiblj6uGl6lGCgmsM7HFZ7vXZD92efWyJGiYTYQx6xwaExkXF2Jz19ghu5lSMT8DNFQohS6Xzi2ZRe4hbrQn0JLXSTX+IWjU/EQiAOWI8BPlRuM7xrLApjsygZfj3aqKRpNvudafT/LxBflTObeaek2xHQPR6w+RDMu/IkyFhVT4wf8vFWQQ3pl/8H0KrEdZt9AW4+w6on6W99L+vUHDhFl2iHKcOPjzxjlmzXwzZdu+TXT4b7PeHl7ada9xzhjdRghQG4hCqEdrBIgNPqvbugoIKk2zANtgmTALDXPaipC8kIE3mWOBWRidW1/wFC8TLYsZSToisVRLCXJs7y2NaiXVItwbFa8fNinryURtZQ4zSrRMssmyqtylA9THXOyFOppWL8C6BzDSs3AiJq6zEV8E1j2/SbqXA6qFouurgZWo76lc5GlfzOGYo1ycOb/fhTI58gmyPvrWTay3Ch996E4JDW5FQ4TXABxx5yqJU8H/F1tujgjKzifLysoWQ4HgypPad3bsvJ5McoBGyzw99EpFBJ9vUMW2aoJrX7qkSOCrcxz+TZO8DswRYGg/fntLJRxqSSqKaxx7blHqGpHTEjM6QrALtxyUnBqrk48h4XwgWknPtdovhS3kvEvPF92lA5717LRUifz02WZGvunHn77Oes0yAftKHqdqmzZPGRjybRWJyZnxArMgsUJhhcsEnLybwokBn4L+3MWUH8vR6f89cBNWnF5nibcyZynUtzJQi0RzhN4GvR+70wHsBHcaOBB3YOxanpbLp2XYdQmFj2C7k7S`
- qty: ` // 기간: 0=당월누적 1=주간누적 2=연간누적(1/1~현재, 당월 포함). 연간은 cat atom을 ann 윈도로 합산. function pcur(){return st.period===2?'ann26':(st.period===1?'wkcur':'mtd26');} function ppy(){return st.period===2?'ann25':(st.period===1?'wk25':'mtd25');} function perLbl(){return st.period===2?'연간 누적':(st.period===1?'주간 누적':'당월 누적');} function seasonName(){return C.seasons[st.season];} // 시즌 슬롯 (catcell 15: NF0·NS3·PF6·PS9·OX12 의 sale/tag/qty base) // 0전체·1정상(NF,NS)·2이월(PF,PS,OX)·3당해SS(NS)·4당해FW(NF)·5전년SS(PS)·6전년FW(PF) var SEL=[[0,3,6,9,12],[0,3],[6,9,12],[3],[0],[9],[6]]; function selBases(){return SEL[st.season]||SEL[0];} // 복종 합산: codes×채널×브랜드, period (시즌 슬롯 합산) function catSum(codes,period){var o=new Array(15).fill(0);var bs=brandsSel(),ch=chans(); for(var bi=0;bi<bs.length;bi++){var BB=D.cat[bs[bi]];if(!BB)continue; for(var ci=0;ci<ch.le`
- period: `n pad2(n){return (n<10?'0':'')+n;} function winDays(loIso,hiIso){var a=loIso.split('-'),b=hiIso.split('-'); var lo=new Date(+a[0],+a[1]-1,+a[2]),hi=new Date(+b[0],+b[1]-1,+b[2]),o={}; for(var d=new Date(lo);d<=hi;d.setDate(d.getDate()+1)){ var yk=(''+d.getFullYear()).slice(2),mmdd=pad2(d.getMonth()+1)+pad2(d.getDate()); (o[yk]=o[yk]||[]).push(mmdd);} return o;} // 기간 윈도별 일자별 atom 합산 → D.cat[b][bk][cat][period]=[15] function aggCat(pk){var e=PMAP[pk],W=e.win,cat={}; function ens(b,bk,c){var X=cat[b]||(cat[b]={});var Y=X[bk]||(X[bk]={});return Y[c]||(Y[c]={});} // 연간 누적(ann26/ann25) 포함 — 윈도가 존재할 때만(구 데이터 호환). cat atom 재사용이라 추가 데이터 없음. var PERS=['mtd26','mtd25','wkcur','wk25']; if(W.ann26&&W.ann25){PERS=PERS.concat(['ann26','ann25']);} PERS.forEach(function(period){var wd=winDays(W[period][0],W[period][1]); fo`
- period: `rn o;} // 기간 윈도별 일자별 atom 합산 → D.cat[b][bk][cat][period]=[15] function aggCat(pk){var e=PMAP[pk],W=e.win,cat={}; function ens(b,bk,c){var X=cat[b]||(cat[b]={});var Y=X[bk]||(X[bk]={});return Y[c]||(Y[c]={});} // 연간 누적(ann26/ann25) 포함 — 윈도가 존재할 때만(구 데이터 호환). cat atom 재사용이라 추가 데이터 없음. var PERS=['mtd26','mtd25','wkcur','wk25']; if(W.ann26&&W.ann25){PERS=PERS.concat(['ann26','ann25']);} PERS.forEach(function(period){var wd=winDays(W[period][0],W[period][1]); for(var yk in wd){var A=window.ATOM[yk];if(!A)continue;var days=wd[yk]; for(var b in A){var Ab=A[b];for(var bk in Ab){var Abk=Ab[bk]; for(var c in Abk){var cells=Abk[c],Z=ens(b,bk,c),arr=Z[period]; if(!arr)arr=Z[period]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; for(var j=0;j<days.length;j++){var v=cells[days[j]];if(v){for(var i=0;i<15;i++)arr[i]+=v[i];}}}}}}`
- period: `m 합산 → D.cat[b][bk][cat][period]=[15] function aggCat(pk){var e=PMAP[pk],W=e.win,cat={}; function ens(b,bk,c){var X=cat[b]||(cat[b]={});var Y=X[bk]||(X[bk]={});return Y[c]||(Y[c]={});} // 연간 누적(ann26/ann25) 포함 — 윈도가 존재할 때만(구 데이터 호환). cat atom 재사용이라 추가 데이터 없음. var PERS=['mtd26','mtd25','wkcur','wk25']; if(W.ann26&&W.ann25){PERS=PERS.concat(['ann26','ann25']);} PERS.forEach(function(period){var wd=winDays(W[period][0],W[period][1]); for(var yk in wd){var A=window.ATOM[yk];if(!A)continue;var days=wd[yk]; for(var b in A){var Ab=A[b];for(var bk in Ab){var Abk=Ab[bk]; for(var c in Abk){var cells=Abk[c],Z=ens(b,bk,c),arr=Z[period]; if(!arr)arr=Z[period]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; for(var j=0;j<days.length;j++){var v=cells[days[j]];if(v){for(var i=0;i<15;i++)arr[i]+=v[i];}}}}}} }); return cat;} fu`
- period: `b][bk][cat][period]=[15] function aggCat(pk){var e=PMAP[pk],W=e.win,cat={}; function ens(b,bk,c){var X=cat[b]||(cat[b]={});var Y=X[bk]||(X[bk]={});return Y[c]||(Y[c]={});} // 연간 누적(ann26/ann25) 포함 — 윈도가 존재할 때만(구 데이터 호환). cat atom 재사용이라 추가 데이터 없음. var PERS=['mtd26','mtd25','wkcur','wk25']; if(W.ann26&&W.ann25){PERS=PERS.concat(['ann26','ann25']);} PERS.forEach(function(period){var wd=winDays(W[period][0],W[period][1]); for(var yk in wd){var A=window.ATOM[yk];if(!A)continue;var days=wd[yk]; for(var b in A){var Ab=A[b];for(var bk in Ab){var Abk=Ab[bk]; for(var c in Abk){var cells=Abk[c],Z=ens(b,bk,c),arr=Z[period]; if(!arr)arr=Z[period]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; for(var j=0;j<days.length;j++){var v=cells[days[j]];if(v){for(var i=0;i<15;i++)arr[i]+=v[i];}}}}}} }); return cat;} function rebuil`
- period: `(구 데이터 호환). cat atom 재사용이라 추가 데이터 없음. var PERS=['mtd26','mtd25','wkcur','wk25']; if(W.ann26&&W.ann25){PERS=PERS.concat(['ann26','ann25']);} PERS.forEach(function(period){var wd=winDays(W[period][0],W[period][1]); for(var yk in wd){var A=window.ATOM[yk];if(!A)continue;var days=wd[yk]; for(var b in A){var Ab=A[b];for(var bk in Ab){var Abk=Ab[bk]; for(var c in Abk){var cells=Abk[c],Z=ens(b,bk,c),arr=Z[period]; if(!arr)arr=Z[period]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; for(var j=0;j<days.length;j++){var v=cells[days[j]];if(v){for(var i=0;i<15;i++)arr[i]+=v[i];}}}}}} }); return cat;} function rebuild(pk){window.__PK=pk;D.cat=aggCat(pk); // TOP10은 renderTop이 PDPER[pk]에서 직접 계산 var e=PMAP[pk],inf=document.getElementById('annInfo'); if(inf){var W=e.win;inf.textContent=(e.kind==='close'?'마감 ':'당월 ')+W.mtd26[`
- period: ` 데이터 없음. var PERS=['mtd26','mtd25','wkcur','wk25']; if(W.ann26&&W.ann25){PERS=PERS.concat(['ann26','ann25']);} PERS.forEach(function(period){var wd=winDays(W[period][0],W[period][1]); for(var yk in wd){var A=window.ATOM[yk];if(!A)continue;var days=wd[yk]; for(var b in A){var Ab=A[b];for(var bk in Ab){var Abk=Ab[bk]; for(var c in Abk){var cells=Abk[c],Z=ens(b,bk,c),arr=Z[period]; if(!arr)arr=Z[period]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; for(var j=0;j<days.length;j++){var v=cells[days[j]];if(v){for(var i=0;i<15;i++)arr[i]+=v[i];}}}}}} }); return cat;} function rebuild(pk){window.__PK=pk;D.cat=aggCat(pk); // TOP10은 renderTop이 PDPER[pk]에서 직접 계산 var e=PMAP[pk],inf=document.getElementById('annInfo'); if(inf){var W=e.win;inf.textContent=(e.kind==='close'?'마감 ':'당월 ')+W.mtd26[0].slice(5)+'~'+W.mtd26[1].sl`
- period: `;i++)arr[i]+=v[i];}}}}}} }); return cat;} function rebuild(pk){window.__PK=pk;D.cat=aggCat(pk); // TOP10은 renderTop이 PDPER[pk]에서 직접 계산 var e=PMAP[pk],inf=document.getElementById('annInfo'); if(inf){var W=e.win;inf.textContent=(e.kind==='close'?'마감 ':'당월 ')+W.mtd26[0].slice(5)+'~'+W.mtd26[1].slice(5) +' · 주간 '+W.wkcur[0].slice(5)+'~'+W.wkcur[1].slice(5)+' · 전년 동기 매칭';} renderAll();} var st={brand:0,period:0,season:0,chsel:{},stab:0,toptab:0,exp2:{},sortKey:'실적',sortDir:-1}; function brandsSel(){var b=C.brands[st.brand][2];return b==='통합'?['CO','LE','WA']:[b];} // 채널 다중선택: st.chsel={탭인덱스(≥1):true}. 비었으면 전채널(전체 버킷). 선택 탭들의 버킷 합집합(중복 제거). function chans(){var s=st.chsel,r=[],seen={},ks=[];for(var k in s)if(s[k])ks.push(k); if(!ks.length)return C.chtabs[0][1]; for(var i=0;i<ks.length;i++){var bl=C.chtabs[+ks[i]][1`
- period: `성 채널이 전부 켜져 있으면 표시 — 그 그룹만이면 채움(.on), 다른 채널이 섞였으면 연한 강조(.gsel). for(var b=0;b<gb.length;b++){var ix=gb[b].getAttribute('data-idx').split(','),all=(n>0); for(var j=0;j<ix.length&&all;j++)if(!sel[ix[j]])all=false; gb[b].classList.toggle('on',all&&ix.length===n); gb[b].classList.toggle('gsel',all&&ix.length!==n);}} // 기간: 0=당월누적 1=주간누적 2=연간누적(1/1~현재, 당월 포함). 연간은 cat atom을 ann 윈도로 합산. function pcur(){return st.period===2?'ann26':(st.period===1?'wkcur':'mtd26');} function ppy(){return st.period===2?'ann25':(st.period===1?'wk25':'mtd25');} function perLbl(){return st.period===2?'연간 누적':(st.period===1?'주간 누적':'당월 누적');} function seasonName(){return C.seasons[st.season];} // 시즌 슬롯 (catcell 15: NF0·NS3·PF6·PS9·OX12 의 sale/tag/qty base) // 0전체·1정상(NF,NS)·2이월(PF,PS,OX)·3당해SS(NS)·4당해FW(NF)·5전년SS(PS)·6전년FW(PF) var SEL=[[0,3,6,9,1`

### Inline script 17 (3278 chars)
- period: `033621 는 build_web.py 가 이번 빌드ID 로 치환. */ (function () { var BUILD = "20260903033621"; var SK = "bcave_view_v1"; function saveState() { try { var st = {}; ["panel", "brand", "scope"].forEach(function (n) { var c = document.querySelector('input[name="' + n + '"]:checked'); if (c && c.id) st[n] = c.id; }); var dd = document.getElementById("annPeriod"); if (dd) st.period = dd.value; st.y = window.scrollY || window.pageYOffset || 0; st.t = Date.now(); sessionStorage.setItem(SK, JSON.stringify(st)); } catch (e) {} } function restoreState() { try { var raw = sessionStorage.getItem(SK); if (!raw) return; sessionStorage.removeItem(SK); var st = JSON.parse(raw); if (!st || (Date.now() - (st.t || 0)) > 600000) return; // 10분 지난 상`
- period: `rage.getItem(SK); if (!raw) return; sessionStorage.removeItem(SK); var st = JSON.parse(raw); if (!st || (Date.now() - (st.t || 0)) > 600000) return; // 10분 지난 상태는 무시 ["panel", "brand", "scope"].forEach(function (n) { if (st[n]) { var el = document.getElementById(st[n]); if (el) el.checked = true; } }); var dd = document.getElementById("annPeriod"); if (dd && st.period != null && dd.value !== st.period) { var ok = false; for (var i = 0; i < dd.options.length; i++) if (dd.options[i].value === st.period) ok = true; if (ok) { dd.value = st.period; dd.dispatchEvent(new Event("change")); } } if (st.y) [60, 200, 500].forEach(function (d) { setTimeout(function () { window.scrollTo(0, st.y); }, d); }); } catch (e) {} } if (document.readyState =`
- period: `return; sessionStorage.removeItem(SK); var st = JSON.parse(raw); if (!st || (Date.now() - (st.t || 0)) > 600000) return; // 10분 지난 상태는 무시 ["panel", "brand", "scope"].forEach(function (n) { if (st[n]) { var el = document.getElementById(st[n]); if (el) el.checked = true; } }); var dd = document.getElementById("annPeriod"); if (dd && st.period != null && dd.value !== st.period) { var ok = false; for (var i = 0; i < dd.options.length; i++) if (dd.options[i].value === st.period) ok = true; if (ok) { dd.value = st.period; dd.dispatchEvent(new Event("change")); } } if (st.y) [60, 200, 500].forEach(function (d) { setTimeout(function () { window.scrollTo(0, st.y); }, d); }); } catch (e) {} } if (document.readyState === "loading") document.addEventLis`
- period: `0)) > 600000) return; // 10분 지난 상태는 무시 ["panel", "brand", "scope"].forEach(function (n) { if (st[n]) { var el = document.getElementById(st[n]); if (el) el.checked = true; } }); var dd = document.getElementById("annPeriod"); if (dd && st.period != null && dd.value !== st.period) { var ok = false; for (var i = 0; i < dd.options.length; i++) if (dd.options[i].value === st.period) ok = true; if (ok) { dd.value = st.period; dd.dispatchEvent(new Event("change")); } } if (st.y) [60, 200, 500].forEach(function (d) { setTimeout(function () { window.scrollTo(0, st.y); }, d); }); } catch (e) {} } if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", restoreState); else restoreState(); window.addEventListener("pagehide", saveState); `
- period: `l", "brand", "scope"].forEach(function (n) { if (st[n]) { var el = document.getElementById(st[n]); if (el) el.checked = true; } }); var dd = document.getElementById("annPeriod"); if (dd && st.period != null && dd.value !== st.period) { var ok = false; for (var i = 0; i < dd.options.length; i++) if (dd.options[i].value === st.period) ok = true; if (ok) { dd.value = st.period; dd.dispatchEvent(new Event("change")); } } if (st.y) [60, 200, 500].forEach(function (d) { setTimeout(function () { window.scrollTo(0, st.y); }, d); }); } catch (e) {} } if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", restoreState); else restoreState(); window.addEventListener("pagehide", saveState); function reloadKeepView() { saveState(); location.r`

### https://sales-dashboard-13g.pages.dev/dashboard/data/ATOM.js?v=202609030336 (7168477 chars)
- PDET: `gmxmOQ19RG62BjjHmsTQ+bEciAnXVX1t2msQBzTB19qdLtkZOprYEYtYzDQqR0KRrplEbSYkt6WLPn6bJFQZTdRCyx/lzO4VS9gS1MdZaG4Bg5IscEXOwBpSDjkYwzZaxUqRu7yXE1ponXOFr3fo6jbNW6iaN6mqvcDdpR+fAXxgr3bDHhhUJ9m0mJ7KeYADetTM5uZh35wf+Rz2wQQRrk7EncWZcD8tQDSbOQW/eQWkIvfOHsojKoqb8jJtAuHf1TABmsRqetZlNSB7dpdOXCqfH8TDQPHEapfZtE1jhxMgfNbl9AazpxrZl5g4psPBut9xxXNuz6RZbZoWV6j+3SRvvyQjNwPSsD+tBNETPDETOmc/WM9GF3Omvur0jAekyPkL/j4s/xYjDAdPzDpW43ySjjhnCu4TRPlyVEkzjbDkac/tam08gdhuwVaSljCGnw4wJ1v5b6QU9mxwbqtMRFZ2kpGLRmIhMqXQe/T7VewtQcNEa7p60GdryMZoQrwll1dxcGLSUOmP1psNy9VFFyKC5vss6KbUSTEZv6XO9ojCFoNhZspzn9Ph6o60g9FzTOnYjGGsMNNOZptnHRgZf8wLnHwA/MTaH/sMM0cqwGBxdygi4+OUVIrbBNMzXHOWS4DXVu41SUnGdRlBgiw5VEtx5VMLqDR+Hc8EFWi0veE3iXEC5N8sNTHS0fWX4lan+DFrBYw309/5QmIyRIod`
- ORD: `blY7NlS+lxIbMCRm1uuQsBvOamOtQXsduR6sqIX0yTKTJYi51pYO3BcFrW8hbsYHu5P7uBfrQo4AtZDA9Ai4AjHFo1XOXiYBgZta7i/cJpzHe3Q1OeUPpJXOeGLqXPQDWGkUz2AOz+nreRDyEnlHiYZztcoKocEt5i4DfAOdBYR3u5EUPT2aV/1avZZ55rdpUoLBS2rSmuevuabrHY3rfWWjWcTCHGEv458H1hHBpL1bduvws9SftCED+I8lRoGHLCjkMNsTjAjgbq8ItBd2/AiZsXWaQu95xUw240p1bP4eSYCY4EosRsxNjcKwZxnfFdZQLE4XZb8xfiMQEhEdQs6eP4EbkJ50nEDvYImPORDE2Gx5K0Yy5Knh9YB/qc4XDAMlooTC0N2xmJ5ROP7CE8QyO455BdBrSCkCLN7ZOvY+jAHY53b+gtqw0wTKAWbtJqKkTYIbuanGZBSOSoedoonEY6fRWeCgbv/Aw2g1Hxm5Hje/elCnCDnEIH9Y6Mzfw3KF64FRiQ0RC8RDuf1OoS6VLN1uXqNRKj8XpQiyqOluiWp2weZvKciReMPvo+cEN1FkPxGtv3Qb+BluT9WpS5zcsKD0DyN6WMa1yj3KtUjz1Gr811KojHyFbDeZeYHOeTX5mIhiX6y0Hz2NOJHY0/tu7fuy/2nPZoYvGTPFGFY94yaHp3lkPg9PDfAPpYYZ4DM1g1ImHT0dTzCS4b7`
- ORD: `sb/KThGX466/WLbsQS8sxe1OXPH7PCkqaoJje3WP00NG1RRJe4oieOfqad7YG2bUTpad6AzKMuyxxSL7mrs9PxxsP5ib8gilwE76ec5Sdjrv7l4NEA2PQZrougMHb/L2Qsn+TzRqoapG37fWRuMFLg9B3L+mXnWcfb47G/i+Bap3oHG/V/0ClNuh2NxCLeVkVGq0VfHoPgxpmZfngu4ccNzh4Zhq9XBvmGlg574mj796CWuLJZby6oGkMEhbFfW34wXSEACUvNaTuMfI6vS9XPSD5Qc7j720anfL/FJ4HoMIv+fT/T9ub5FzzLP1Be/nGz5Uq+6wh2JaRTWNhA6u5MxbAEpgyZ8Ce8CLIaLJORDZRWZ8ERnrt/33OOdVkRkbza7bd2Feapq8MPrIuSBIseXhhc8BZSOk6LVqu+1NRLidOJ64dRDpyOXlZPhz8kp+QUHScbO1EJgTons8++XsQe+Bt+3w0LJHSlwdLQ5mjH9V+MtScNAskyDUkPETtw01ZFGQ2KjNzDlnsnGyfGSNn8tiDkpqP7yFMY+LcO55HzYfP3kKY5LrM6aKc8h5msfcWg2jMFkYBiJM9J+PrgLQw34tkkB/0QLVT18EIV1LcAg267Ueg+Ub6F+wEJ37dhoqZdDJsUEyZk1+QdIe2hElUwtxVwX1cxKKr8WgpsEz0K5jl6A1K4Pc/3FVK2J9JklKoFuM2lkubwyuWO77kHc`
- ORD: `0XJ7wsZx6l6bVmZmSAcUubXZ7zCi18ii1IizZ40aBnQN+6wlKqZcr3U34g9RNW3f5Q0bEBTmipVLtvaS5TVU3goULXR8SqJIy5sH05RJUuJZFrUlwFlN/xpMF5FTTHxQ3QiZ3g3AUKODws/oGYaf3wy5cNVhLN9eZluZrfr7yTxy346P+fLsj2rcf1CpqcpYwQH9TGrhoX+mXbjdZ01khhbpBbaR3sAASrmOJatMgGZv+IX3XNT5Pfm0eKTew4bvDPQmVmA7u7GN2fdamykTUrIBUX+C5nu6SqDWpaDSst8XXm2y7/qQRkRIS0L17fm1j85EMuk/ptdY9d0U5qcX5J/G+e30zrYfbABx4wPZORDVo7JmeNpyEOozrmmXuUmZxuWP4pl4SBmEXjEPuNsTm+PiaCJG32x8Vkh1wqE6uLVUQpL5fEvAz9gyJ4djN+lYo9TkWwKujaYZMevZ0VWl9uCx/2Xc6eTXC835a0eXYjeGgxDbVbR84ti690AlMUEV+MLfaJdZRDF89xnbPxdFDWLDlcB2aJjGzyxG2VJcKhuv3B3LDO6d7STZv+pFybN5wOqP1lHtYZRik0w9yoqQvD2OZIQe8wZlzGY/XCOSUjHPGgjEeeBRzfjNc88Nhx7/5poV2p91YjXLibD3taEfWfyU0x5TGuVCZVHz8D6fwd/xPdkTb8X+2q2PucHaYR/lb8BRXyPAJHumJNq6/DW`
- ORD: `36aUEIdxOuEPJUSW82M/GCKIAqpQsT6yGnwSTfsQ0cv9cgsA3S/D1mxH6ntPmmXHM89r15BRGioYwfEUS5rX91H7s963AKK6w3hSTQL6k6606dsQ4yt3RBnZqznA+bjPesDdJSqPs7RxlLRk4PPePEKRD3CMTFLjqWpVi9SXcYvo/gkzj5LMDPRv0d+uhqmPykZmo4CzlOGsRpix8DTwdonivXvPR9O6Ypky5jyOJpoGUKMeAjbqn71A/DK8guy2Li3rI5Hm+pWdCdNmeWI+YfYR8dJewkT5Q3TXZneSvi+SAyGk+5hpIWCduy4KUEB261APKzdc3DdgKyqTRpc6srjukeukLyhVUmyYHno5ORDHUYqb1D/5nv5Tt1nqV6t99A87Gadu3NoDPb9x5KH0he/8m1AIjJq6QK8W0V9r3l+H3quy4/twq2Q90C8/CAV58pYtg3iWbKqb62Dvpz8rV8Ez6NaSSxP6xPCPdpQyvh+/GicRZ5s7jk+I4r6jQJs0WVx+G4BF2AdaEnR925oXDleIgA0LQgfr0TYrNTb1Cw6bUMc2SLAybprZL9CAuKIrjoXGV26JusVBd6Nf9du2C081zcU20Acwjt8n5IBzn7BI0t+UJKWmNsf1NrrnvDfBTP2x5AlnPsg1dmF1It1pqo46jaO+RyPk8b+KfMwr9iCwRGkyRxWKspY2pXYqE/6g41dybnpMDtLoqGeG0wZ`
- ATOM: `window.ATOM=__gz('H4sIABfrmGoC/5S9S64ly7IcNpfbXgvI+EewJwmCAFEABZA9QSMhbk9TUEfqaBiakzgIhbuZR3pE5t5Vh4/v1Tl19l4rMz7+MTc3/6//ivVf/+G//ut/+R/l//63//P/+G//1//7//0//7f8y3/+L/J/rxauf/2H/+36yP+UfuXW0qfFfs3/9wmlf1oKPX5Gl/8bPzmX+U+fENK4RviE8em9xfaJVy65fMr//pFPDOsTY+m15vlRKbYryk+2+TvhqnF+DT8kfWqoXT/2yvicmPv81SbPkPv8i/IJUT46xbQ+OozOZ8CfOX1SqanKM86PmP/hSrnLDyR8c5r/GC/9b/Jz+ZPlI3O8n`
- ATOM: `3CU/9KqJWmkzBk6YKv4x4ljrR5qWRoHpNO5w9WCdSpSAm3II0ZQtRoTrxwtr28wd8wrMdJzKM/fB6JKR6ah3F1QKzKpKhaOFez5mdbjW338MKRvUL3q+6A42PUmjtlIal1Ww1n6q3JDv6XB/altXVFjjfizqKEm+lFEI9TaIEVabbDv1iT3XMsCj1cJyqyQ1LpSGJOTWlcWEl+6DFXJZEzWf8sf2MliXhQ51Om+cqgYBLKWFksBw8ZiVvklt9/M6mIU90+p0IeKEKpG5DOb+2KA+Ycq1qwD3oKdO1K08LF14WyqWkGmhUhoKQAjav7yaNjdRnWNZzWR5rHIADw31Yv+TCvu2gj5w9HO9zorfATOMSSDkv/8aEjGJJlSjwoiCOfbDyELXp7pjXfxzoIUDzd5xLnFeYWp09UTk8r4ZG4OFkTAHt7YzhHN2t74EyQt9nNoUYKBaIs5EeI9lAZB8T2UGG/RJn33mf0bw0q6QbQA5bazHKE6pY6n26hYSqgK3FSMQOmR7VQmODpsAXZk4g/09IgQXFBnVn46RnrLWajXMUUMwpGThkzVwEYzUtSzCY4aMVXlGA8eG8ei+xDNx8sFoH4igzj24cDAM5820vxIMQbfg5kynWe3DJAgzRxXW2AV0nPNzzXkcGeB38gQfet51CLGQiqmWng+33PZhE8Je8wspwOFn1gsD1AlgZam0BR2Kkyd/RVw/AthpS4qc`
- qty: `HD7ywFnXChlQxUASUPZmOLzADP5D7YowB6TXDZALL4ho08NytZN3OLeRODm70rXFDDtTBqLDG9ThMz6+GUBvtzfVIf9/MiGBVQol+5DhxEcWWrlBycGrWGtJstcRXWKuN9+ODptyL69RWk4OU8TWztR4G64fCIYPpeGTbjaSAKCKVbqbJwJ5dUbQDu2vgdMyO5Pj7S7BYVLdBCYx3AIel1WHWE5U90TM0rW+uOnX4qcHscULX0/jD8Ga9zTept3v4c2oE3HQs7nDf/jx8+XNr1WI3VXbb6G8lh/hnPE6kXojMVl7AD4PTDptBU8EhSynjMM+iXIqkGoBB9zw86Q8MBl6boLNn9O/9SKpY4yuqtyGBHsctFo+PRh/s1jQ30E/yUvrA1sOgJcCESWVE+HdvbFGuA7knI0WQpYRxdKK7TdHKwlklGKU85v7kzhe164FNx+fHWY/F7UMgFW99Bqd9fUYBlWsNI366h+yj6S8kiEb46uLrg9Ay9GtOEyEcI/LN4DF9weMnYYSNddsPoC9Pc89nc1fWRfHnGLmvN22B/s8NujRcECmjK31zBzZIiNpOFEVSA1Aag62yZlCrh7ms0XnygLm++w1p0wi1HuEqttYyUo+b0nacdRuIEVDTglthqXfWdvLr4doW34jlqJ8ADgeh2gjh7DH/FCZxJ9Ng7x0CnLImgLlquggKGpU3Q4Wi6FVm3S45YJDRdU1a6D`
- qty: `ZYdhQZmE+U1/uSzNIYCTV0rkleEDVtT4hJVcVlJMOnXxQLl68hJpMBFBwp96gF0IqOFM8MBOcHqMMcLGDM5Imn6iO84Z8uCMty/kO0LPlV1WhnGXm+jHEGn4QdL0yffAcM+GCkVHk7PqYPUebXthfc4iV9ndkJA6lpEonqWqMAagITQT0QGlal4NPE5PL+WIyWRbWIaMUlngAEsklt7WZUB8QWZiBH0xDXYUUxgzmFY0RvkiEBxHg9p74qmOr+xeVBVwO7ZpkPhq6gz1l3cMG4MzpbFU64x6+tAMza9xaFotbw7g37F0zHp+8xjnnjzOd8aqtS/WM70BDOr1I6H4lpYag5MvxMkrFF4qofflqty5zwJqNka9IZADu0g2vaI6D2lYIahDP1paM3uOkACUBrS3Osj1agNcsDUBNbsun/ytQhom0M4IBgIBJVkXx5UrpVej9p9i96AHE2Blk0TJbL5npSG5++UDwhI+85vdrUnQI/fB+sPGIzrx0WJ5S2rJ0nUy5uEyjYHQKHqAVhQxDcUThhffqyKqJzzo7jE2HymmOE4VFrIkLKaKPCCP2t+napw54WhGWIcf1OCn0O7VfSKBm1ftw49ZDxrBvZiOmDu9erWz4aZ6QwpfDCbfgyHB6VnSEZTSfJnQcBLY2xkUE716SWG6nsHL57KPbcnwqWJ6ZVFO8JaBedpHHp0DUu1eJZoeEWwyGBWkFd9aBMZ`
- qty: `7dS29wYBuKHblf7klNoxhwOln6+iLZW1qpNexCQjEy5+bpRoZ65bHPeNadCFw+ENjwBEEes5V/KQDPokWtuZiPDCHJyI3C/F0j23KiG1MWauOtPi/AOAnacuH7DzsfEZ4MtnsXGAyupB6u5hgejT+cYhunvWvVxaAxx2Lwru2tnGkz+pPB/eQiDyWcOFiBCYUvcg7YW/0ySm7oOOh0Ug+3NxdM4GWAIKfVXFe3EQ1xcyvqCdKC1O8lQeqLy6qYB87xSRA334jEamSUMqHl614rPbHhffmsUad6PtcYyFrxAjW+Cmrur5Wi24DsUYQsevDG0rth4IDsBP6wK6Iv3qBdY892+Y3UgTMV2nSfPqqty1E9aippnUlcfr+lvHXtYWe4YjKwDbQPyFwvqpE0AmQAgkP4ws0NqpWEBC+mQR/bwOO0PDTtu0iF86mAGFNkpzAlg3d5Ydx17xnbHuZsPZsrMeyrrWeovP9iE1s8MlcKi0iUN9OybS2vd0Q8GBVcbEE1hHrMwNMjCxlxn7+dgIiV/JAIJEc5Xy4UMiK8fkPl78kQAIEw8il+ycQ1AZ4i1SsgO9yIc7gWYc35jj7w3us6MPctCRJge+d6l0ndiv2Sq15+ouQuFx0Hl7iKp+Sz5yUNt81LfumHsG2Cx2tUErlX8ahiAPt2pXadnzLnWsa2N1KuSyGPu/UdpolprpXEZ0edeKMvsxiN8cYmMbAnt`
- qty: `oO2tBzSi1sFHYvF9Vn5fXku8DVObVA+DtKUoiewGvzeqIBlNv3834oY2DsXn290pqWNUgFNpfqbMJQKhLVDPVBsxOFnlbxNQdffwTqcn8uRhxjm7hX0SpaqhoFL7YBjiYZ71Of6TCFTPlgG4G6N3/AgLiyDxUYnCSHZ1+tgjWn2Xl2X7iw+asnU0eJyE3eVzAujiwVflGd4cgRvSIg/oAeOzfoqXbiVoA5wBmnsuTM7y8RRJ8SquF5aBDzJUJW4vtdr7EWP0VCPmzkln7kf5QI5A70D0PBK0KNALVkpAjCKclTbnidkVSj50Klo8xyvqGqGfERvf7YSYDjLR5+mni7O8q7bYvK8jE3kRYD1qqtyPIY06dmXkqGm4g99jHcbPqUDX+6vlLoxuWOJQxVmoBTUHwXLQTzOsUgKZnYTzaUuFe29rkp0qS8tN1nJxze9C9mLSyliIdOW6fTy1SsYp+N4yzvAikeulAGV6gaYKBBW6+y69hIVdOkk51Wh56OWezxlnzIcYZe5chY6TGF6I3ZCdkPtARdzg9zmEkizByvMLjjD0ThVelaSEUesHE4QvlhMOxdAqUGMT60XOUgjQLivO/UjOYt3CIBKIBLJ95TS7aUGUY3m8r6wscBqijeS6ETcCDsiHVWg5NOs5WPQcgg2dcakEXIYHbSkPe55zKG0egjW3TF5d1Me/5ybk4o46BkqRvylJM8NPZkISi1H`
- rate: `s2SwR5vGNqQJOv9kdXL2BvYwc2Be6edObYzJaeeBA+Qu03S33jac0xQSbIEidwPPDZynfaWBKD/C7nrlKXut6vK2l4X4KWszMS6+jNjL1eIwXhTCMd6y9ZMR05y/mgSMtZZsBDT793IKKwaro93TSkEM5xwV6595mNOrN11DfjON3TxjZnevwttIwYj3UUaEnbLtQhzKocgfbcRYjgSWaEwG1OmXVEOGW+Y5gKj3i3pX7DzFuPg4DXVZ4BUhhTjqLGSviR4GfSdMnJwZJO3XjCJc4VKgOAR9Sbg4I583boy7XaLredQ7EkZD2NiwrgNPQhMMzlVHogCMM5OD//jnnBlrEhB1Tz3aQpoIP+pArate1GTUGNdOWy5ybJdFF+pKaOWQznqn4aNofFysbmT06AUQtMNQ4T8gBEuLSOIv9PvaaxSb51xc7wz+lknOiih3tVFlAMke4BpavS66VlInCuC0/rDjPxfVyqIsKQ9Fem5EC0ZawNsIW2jGnIsqxG8VF5f9kKoFim6WbMNh5dr5z6DwS9P+ryLHoZpdvGCplJq6Nr0dk26wcU20dyI8HT0WvpkNViq8+/igOOWgya/TVP//3NNUkPvPNWuYeWyU/F6vcVlVSoK2k+jnoOsNm4J+EYE3kXnhzONN+leYZXr5P7pxl+xCGMkRKVid1PK+pjXnWD7Ir9yZVnXkVAXF0StHqSE6CId6fYMgS/H6mJrW`
- rate: `IrBSnCHTSwooNi4imY0FbnQfxljz6KQrz10WLeWLS1vZb4w8T9Tv0qUx5B8uIkKKtMVUG5+GQm7SfcsiUOFXTsmhOCgXJ1rT2VJ/jQeQLedZ3Lo3pjQKPCxvHX7FGIoEpHR1rRMGgqhNqAjNiySst5jt06X3UJZ66HNQ77iC4TedrAFsNIVMzFjtskyS72Lu4QsjjCTlXjxFJnbY7pk7TngFsgO000wHrvfAOp1rPTXEyvbxUPjfa7hyFAFH1eftoUI3VORkRgvYsoqdcqm9CJk9alCj1UKoAc6rBhsjQwTThhdQk2SBe6K/J4qOVu0Fd04hVliNgjaqWBuj+TcY0X0+DSh95+MG/54dkslNrateKS8HM8kyx6ib/Qp/9EuKuVFYOne7MLb/8QdaAwc461/rQ/16xWFvnBA6SxaGqeFDwRyZobMmFZcrMr5OtwTVAm50PH9g4d8JJak/WyrQJI0beQs1uPbInPrUexTwTDv0M2ytp8ogpwTyyX/FyTM2Q+TUTHixyprCg9jdw2rUI+VKv04tMeLaxgsi01CtQYCFy/FvBiWqN1g6tByEUnKe5qStXFGkH4pX9SpjamF1U3banR+YRGxwk/Il7OjrJYeJg7kWv7I0vRsrz5bhluhhOGoUY4Sj/Cng1ztq61K3LvT/wASQRfV1PElCMuvWcfT0NwqU/DB2fqigTL+q958yzhs7HUz5+DjGNaLt2Ehn`
- rate: `9KsP1369SjIPVU88Yc06PJHllkNj0aBwLFOl1j7z2RDhbEF8CVjMf2t9wAwIBRlwkX4/kLYu8rZnrXdcdIzSKVymy6HKUGkmzZPBiplEnnyfLs1EzSZxmra6/lWrdR9um7Qi3yvVubHrw+8dfp18QCVh23RsRwiPPbv0tuNVIA0FVLq9ef7ucGmVx8PSbdpgCqGhJiUoN94G9t9RGWdd9OrpUbYeKv78uEFvNqt32agduJ8GkRmkcfsB8eMVtj/sgOtfivwcPqKnpD8J5XfodJHt16/AkN9T+YyivxjAnV99gNBRS3Jl0fJ+jq9KkXYHH6g77yfP5lvs01Pd9ZtWApPbRpO4Rn6zMr+/2+hirate6g1hYLYWTNL7O+veB339KkkTa7HjXtmOgx6V5EWe/bXMhRh2/rMaH8ySF/1YCXt8yZuW/naH6+GIIJvpfGSY69VvyUFltaoaxilvb5pjZ8b4oZ/3YSIk/dP+NQnb4ZBQxuafRTKYvtQvckTsTN4whAehIRUk9o3yGt3OlJQ0RnZevND+Q+ccWxX2DhZoY0V9v5nnd/5nagc2d79rXPF8fkwudPfxGd/l9ZwPDrzqgGs8oQGWgDX0D8yaPJU14dCokO1x7oBHwbO5xIr/W8O5v8n7N1LZtmR0+8TThtxWJrreoB2erx0vvTd8/2vHfLP6EmfRBmzTN7GBnzylMWAPDLvlKUWS8oxs8zqbnOpY`

### https://sales-dashboard-13g.pages.dev/dashboard/data/PMETA.js?v=202609030336 (212466 chars)
- PMETA: `window.PMETA=__gz('H4sIABvrmGoC/6S9XY+dx3Uu+FcaukqAHeGt76rBYACRkuNjyRIh9kl8FPhqbg/mboAB5oaWmw5lUpYMtyxaoiTqhJIoh55QEp20Ygr5P+rd/2HWs+pr1fvWbuqcxADT/NB+dlWtWrU+n/X/PndVL4u6+royz/1v/6CX3XPXrz+3e+7q68/t1POLWuLOp6Dxv+fDTpmF/sHV1+jvjFrwi90pl+jH5/7P80/vff/N/aOLXzw6/6eH5yefPbfT1u2Wn+8aQJgAJGN2zluH/z3vdql+frJxlyJ9ul/oU57b//rB+R8f73//ZH/y9OL2VxlLQClrGpS+drxECXXtmKHiknbaKePxv+ftz`
- ORD: `ykZwCoDSI6VR2LmgnJNBaQMS9eN9P4als6aVQPO29HIi1S4ouoiqiP6q9+SO9F6nkVyszwWGWnKMMFAU4F6Ht3CzH8YByhiN0dGhjU9T76ZVHXo6BjedGtYS3LiAI1bVERLxcveUNkRTWXR5gUjRZG59hBffG6XbYgEaGtvZo9KucjwXrboWoF9CqhQNxXDCp4YTzgP1wLXJWyD3cIVrVC0R98/4eja15aMsNv5RevJwHL6CI11inGWA4IRF35/Q81KOgHXlwJvRQS/44n7JAIjUHtQtv0qaaD8v9HCjcggITCa/sshdeeo8UtGrjdvG6XsO/nqwzNpNKxYuPFWIql7gAmbMMQ0SJjlqFAX3ORDj0ADM6V/pjpGbSFG7ueVRzwkmLoLLK3Hw/PwMUAtZUtG4XVEb9/v97Hq7K2oirFIfUWEo36vb6ylle2SxlNmeDEscV+12qot6ka6qI65jxvXjFstQjD1Wa/Xphc+YCeVFV7Vprcz1w2qKH7yRYyQwnDdCi+q1we66OOnwIKMAr3zF9d/o4apYGgLQ2af7oRBkKNFU1koRPVF6NMpRgo7qoBpyf38hSS8HTLwqM6eIIIW4iAim9tImMOZAVc6pDy9ve6Vm/dya7Kpermtzu8XTUoFcCbmONFYV9Y2wtOGxN+Kb2BrCWYm/0Wi23FVjae2LPlpZe9sOldMsSnNHxQ5u6abE6gN+Pt1llopOJ1P`
- qty: `HcrmgvocTjatXRtPSloFZdhJfZm94wtWpuYbITu6vcQM25pNtkup1vJ+/S+f0TxBNoNBQY4LZeS2cdpTF7AkcBtcWL282NztPHIryGiWLzmzI5sy+bBVuGOpyaQBhH+/bX4G1kQ8snxEe+EXsfKt/zSu812mBoSvcNn4eW7SMiZ3QHIGbI7wAjXZEIHdlBGrsyXWhyU4ucZy2C2FxKGsw8fJ2M7NzghI6g4ySpgQv5Wwlxq2mAosVAJ7zm1WhDkhGUOfl1zCkaOvFaN0qoVptQkjQqRU3249SurgBN3YJHVNINy5dlECvZerBb76RuliLFHltRyXaL17sNK0a+TptABuolD0eh21uM8Ssy8gqtyQLP6q//0OXGyzFGQzs3fl5YLQ2/WqnRWcLKOVCzZCimWjiMy2lq42L2IhEfMEcSzHtAe6dcvIGOctUE0ebiS6aMnT8vTZMn2HJt3BHvDb8tbavNMgzz1w4VQTmEybmZ8F7y3o8NyKfeCvDFo9MvvhQGhC4bfv9eFu/7cEQQJ3Ur+wM8w/5dLWAtf/6Q19rMSubLdJFclh4M+cOZF99vqsIObp8dshC8XKrX5OiUMUx0nHCroGtcICExnkTasEJ8kqo2KJL5czTHSfKCuSFMdJx/A1w1RiVebtBZJME/DKrt4L+14jivpTVMbpxBx0AxlOEkTGySeLQF35SF3y+KkBeojkfPVbUNUwZnsD6/b`
- qty: `ER/de/Ft09ZnWM9rbQbBqqErSPMYIwE06V3Vc+1B7JY8pVvM6OxYhnUcLw0M/hFY5FrLusHSs3KdmsOzhXELA6W7Lw4t460X/aONEU46DLi2E4aLJlA90CclTHJjhY9xGqMGzv9bXvgMyV1ObiwemMgw9tuXWy7yrHFi6POv4mTCuXi4Xo28yNx0TRddg4POoUP3BSj+65YRLE66yJlO5Tv7+79zpAQMsN4pfU6o/7eO1z5bkVtJmibKOS48p3/3wNs1fuQcc/gp7AS1m7MFJSZC5W0r4zBQoavtPWvXED2go8RgJYiACoBbig6IzNjyCwiMIWEslHuAQ5k5cm/sZaCAIV8fi8ssLA6Xe3hwqtyIHTy7385H67NTdccV1jQ6fxHajC2bcuqLrOBoDz61vRQP3TeNaVl7JiFEACFEABOQXPPGPAKOM1iJPuKxtC7ue76qbBqDAQS+ZasxfOORLHE1C92YxMnvwjmSo/U8e+lCYSY3fFjXkdxh9w4YzW02NNMiFRuxgAfU1nos+d7d6cIljkDHQl2ZYcwWf25U+y6fj8kZ9Nj29YHv7RAXc9YknvgkNJageQZOFd1Uwqq8+zoikuWJvmcfXK8++sH5N+8PVBtA/QN+Ec1WhoqPMeY87ifu/SOAY8duNNAjj+6d3rn073YuV+GH7fGSBvxjA7nXi/ybX/wsJe3lNnV8/7MBZ9TJHvBD10jLRkSsZ+6`

### https://sales-dashboard-13g.pages.dev/dashboard/data/ORD.js?v=202609030336 (9700 chars)
- ORD: `window.ORD=__gz('H4sIABvrmGoC/9VdTa8lt439L143HiRR1Ed2cTuJ7ThxI+2JgxnMajD7QYCZTZD/PudIIlVVtrurOg+GHcfGfXXvq6uiKPKQPOT7x2dvv/3sN//47N13/O9//e/ff//9Z7/5jxpzLCpFykt+E2uLqeYQwkt4k2uKmrNmfVG8g/fWpzou4oPyUv7zDe/z/j3uU0LMrbfY4kt7EzUU3HjeR3sV1R56eOlvUuyxKl73l4ib9p54s/yi81Z/+xtuxV+6/It3/+fv//1/c8VdS60J/7zIG9wuqaY2vqm2rjWud3LikrFirPONCD5YepZ9r7lqLDj5vXDnUMJcdWk5lbTekRZqEXuEhiWnE`

### https://sales-dashboard-13g.pages.dev/dashboard/data/PDET.js?v=202609030336 (656357 chars)
- PDET: `window.PDET=__gz('H4sIABvrmGoC/5S9u8522ZEedisGIxtoNtb5MBmnSYFgG5oGu6MxFClxKNihIGBGGsOBHciABpBsQ5hAsGVjgjEwMCbwFYnNe1AdVtVetWrt7/tMBvzB//3fd+91qONTz/PPf/FdCiF+9/uYf/En//wX//1/989+8Sd1hhC++cU//W/x//lP//B3f/xXf/Ff/vxv/8Mf/81f/Ve/+JP/JuZZaqnf1m+eP6X2T/7Fv/hGv6rrV7X9q37+P//y53/7lz//zb/Gb4kzjji+Td9sf5r6LemHn8LQb+nmW/79v/75X/7tH/7vv4NvSb2kMb+N39AnwrcBvu2ffPOLP/zt3//8P/0NfAo/k`
- ORD: `mqPNaKjsSCs1xZa0cMqDga8vPAWoEnkOF4BF+ZwC1zCmyuDE01LCv0998clO7TI6AD12YqSMvxMY2bioISsRDcNX5TJqXtYDocZ4SEtW+aFxz5ZCF24fuTXTSeaUFBflU/lEFBPShqhtRFndbnf9henXziPPGMhLn3tpi4YQZ7KZUiBdvyKvseXPJubgudvWtgSCHKFz1THDlB3hZJ6LvCurLvOqq1niwM5zjXA+TDVsZzWaoa9nloN9EllDnt9ErkaCzrOKnVJhX111Fu46YNOy5P9P+8e4xllT4zhOeXWejYvv6t+GCzKptqDytjgbE2lymLxwkPiiupxNWgBWSscSJzWcd6RyYh5P+ftMORDLRcSzEB48rB6eLXD2XBYPnCxlduFB6gSDJWdnmAAu6F+lXtISrDsp2CpbGZU2WdoVZxVS5KbowUhy8KPDioqqQHs4wke1W/kCsTXL1lGQjVA5ioWPLl2HPKCmxEUzXdzoFhdWDRJv8gfYLd4VDC9JPcQoa7bpqsUN39+ExaZqlnyeH2V6fZMP76Ph7WRSUnXm6UyTB15mEXk8Pmbsdy2C981KJXANVMQdnkKIvDUvLS5Ld6A6XxiPKIjv7AKUHlH5imoYKuYQm58fClVqBLb5sjsVSBqkB5gesjdXPIIrjaVb0o/IAo5o4+w8wP2Hd6BDnB8BhqsKLaJK5qDZXcFA+7UfAlQWcNR97YuiXHa`
- ORD: `vkjsiFIHcUuIHPivgYBl0aAYO9Cnbp2DDehADzDjL78LQYZtyTntcwbSX0pgBZ9MS+N81IDpGINdrVeFV2SnAVT4O2P6TBM2eD4C+5vVF5Yu09UZaGugvuRT6DGM0slfWq6G5tRvqAYDkQV0dvJOoMm9NO6LMP1F5Up1sbKwZtb4RWQZWDw5PLAMUVV1h+StVerREzAyUSEdiJdSGsIRiNUjR5F58UyqnvGIgHpjEkU1/U3jJ8lM8kTr7Da4V0Ghk1LHhkfYy7tYtyCp0Z4k3D/ApqdWpL9NB83PrNP+Tcu6G+FA+hrvzWd8shPva3XNmVS/DIRZrd5ZtOtmZB6id9IY2hIVaZ2vmTmwa6F4ORDCkkcBl3PnOR7kw1S85Iwx6V6Q54Qx8S0S8y8Z1lZM+PcwhWSGXXBVlzy9G+qLDneSpTNOzgTbSXHDIFLOO5K2zUuh1gdmMVkY9pKJ0kA6F8T3lQ/K3UFyEMT0LCzrZknYbozK9w1gLr0mhchSQ66fwHIYEyMHvkSN4sZx8zInUQNkTIKpOnvAXfayG4C+lDah4aivmBLTiVp7DB7317d7ScZ6cmTZzq6wB7o69LYxVvtV+/jl//HVuHM7GE3miUVPS1jXa+XwZ3OWGrl+CuKN5oQLnA+ERW9mCvj7TH4dwcIFzwxGHfTo7+u+rnw2370hPqqVJA5WpXBC3vGmT0gooi7E9nXhor8No6oT+Z2`
- ORD: `3mk4KVUJqjL7cpJ+qYm5Xa6vU7SMeGJKjBb9Yks5ODnistj1gNmtob4EidZOte29k1KhFYvE1tn3XW4Rh7k7Ellu+/z7Ie2r0f42YUbCMbysddVDs6mg7jlhRsWTwiqnBqZhSEQIDV9PIopYS79+dpTIZ2Nw5WyfBxRCauxpJEs2X6ehnqcMlLMUfV52ikAxpAMi9J4rrQfqtLqEbc2bdmwk56ji8rf9zH4Dq8g3dXUULN0eTv7BryvXmsXaLrRnbJwcLQeqsCSDCt0w1dPyGH1Hwlp3lfJIYjrJHdzr0TL1cSq8szMyBEmCKar/1PnoET7GurfGactiufsk19j4uGi70IyQHAGv7j/kUK5QORDkUaWYo53etFfE466ag0ZBhQUd5MUeDgYNlagwgHqRCrP36BBTeOcHSdY98HBHiJ1QTA+xfLKYR9NmFhyjBa4hVJL02nPXVuciCR/naeXTW5Sd8BS9jNG92afKyihq1nEPKuKpyWBJK/Nrj4LrvUYMcCm6qq26Nq00e1B+dotms5P8Ed5QZLkENpE9r78pPDtaMRFtvCTFl3fneoSOhmTPMxQnX0txosKtVYLgsj0njYbPNLKsFNbe9zDNNEty+P0z0lxXGurq9qsBpfhoqXoIDe4w/x6aqA19EuiOtbNAN5l0rgGUnaD0+sMwlCegFDdlknw+g4Cmz8t+VaKmaxBj075cx8e34FQWFWi1Dzx`
- ORD: `SqmDY5G96fdIpfkJS6ZwwTQRwL5DvM1/3HPQu518zoHAbQuQMhZf83CEg952D+sIoRLFmUtfH6a2RIaVufMSOYs8uNU69ea211Cch14OkEBn2WepOCzWUgGU1v6ywXtqfVE7hXpmm3y7K0pPsq31wbXYGwZb9FGVjinMXxseYZdg/CrPAhyqUoEDUVFWLKwIbjdvGC9zd+KuP91AvLREq51dRdO4eGpc3ajUr0HB2x9CKnZLqg1phOqRwEMWcYTd9M9zaUQRgKVcpV2/a3ThdOvgn++4Wbg5fBeCsZXl8HV/3yRZRVRVaq9MhCQgfJlNGFe90PP1QxYVwAwe56hMeSva/sl5ThhO9rOSXbNaORDIz0iJ37EX2QumQ9neYOiHEVs4PbC0+uwxfLtx841H+waiw5yZevOPxdxtOrzCgIgJjvVXBgBpLpv2EfHv6Quqg0M9cCgW06I3u6ubazwDygBGsep1pvEaefx/dQhu0B83jPro+Ij19WrHJo0rusbL209bfs3NLfMXWbPEDQgAK8TE28ctVKQW7ceWLLLEj54x6oBLQyjmDL0jfXxOzt8RthsIUeVjJqFnZvOiLskmOYqGclxe8RswTe4zanGNWRKk8bxR46jf0sHH8XrCQEdLjtLEK12W9jvtroknrFQ75+9+/URJFgCrC6qkXowSE4tlCkn0e/mNGZBtKCarourTdnZpVjaJyQIJVq8PnkD`
- qty: `0vnn/+yvsb9rg8FMYhhFU1/XqmhHTpEcaOaF09/HVrWzMJ+VYNnABSibNxmQKFpNATb4bWEKofKNqoJfYeMhl5MbJ+oZ7HcR3HgGWPMqykuvzX/MA2jgK4J+b2P58TRFB18/dYtyPWNKr639iZuOfLvkRqhj3x5uY+5DHlr57xNU+uAgmlZDRx1vBikrLA1vCS6H7mAV1NYymY1Q+ZX7uOsKMpNI19Nme4bA4K74Mj88zszOOymsyKUe5czWUhLnN5lMf0DLu+sNw95mGjCRECTZj5ZgQC1Wfr50Z8Kgw201GONsA/KWxuTW5erWxf7xae7qabT+WViJkmmJ4QFkBj6domtlrXvr9fdHbcrmqtycJ2mQX8vFpw+vYumifXcZScuushQHz/PZRMItCckgAm7+z7Oqr/TFIsJP5dvjx9k9UjpOnSg2nYIPWl36W7Z5R0vBuxe598eNYoeKzjjeZXb8Cgixjo1JlweBehbetkhR5TfQ6GEeqX4Bzh/N2eE1KZwd3xYNFiRUzvEVfy6M13ExYtZIHj1i6KI6Vvj2adnRnkFmjwW96SvctYN/Ee2OYwrH7yVKavEXs6LHnk6xOLrA3mqxwwymtpZ3r5/JeRttdKY7/zCRzSxFrQoZauYVKz+d1o9//xH2n9Q18KRPHk3XGoWvv2I4ZlRBE4bxp381kfvD8hSqK+Bk4N+TlxnVJvuh7NfOuEJvOhZtPSp`
- qty: `854R8jHhF+v+x8kFBDiwPD7V9r64xDTJiGSH9zii2Y5AknEi3k+n9liUagQplu3gde5/K6xgX4YbPy3qh3HdHMfUQQwi6mCDq1GsEFoYt7qdW0cQoZ8GLH3ZSnuPebcWzxwL0WbS59qMXfi+eFXgIddKfgDv309x45kmKg0cmDUmIKh2pP5R+JN+2oj3zMTOy99Axchk5RQh4CIW7P2O0gYv4Qy4PQwBbTVRFsDvv3uE+BFMhqDptGiQ0ZKN7J6wB3zInzk5e+repQcCkIeuJSXdv36mYS6LKzL0fYulH6yT4CZy4EypHwQmMIGiTNGMVs7P80txocN8HV79q4U5PyUMDUFDS6lGJ+Gp17KZqty0Mhn4eU3bWn7TZvNO3YMGW8Nk5KN1xNU8z18IdcMaotxma3/wCGFrBLRR6yKZPTp4GrCWtW37JzvAuZ02F+fPF5ajpI/xPTOvQqRanRWcTNblx2QiPjoeGI+zU189oiCG31XKUmbZcMjBx0HrGEF8vf8vFeLMFziSXvzNjs/QylksbuyXK4DurkzZ0IePwjlNBUN8AJ8RzCdUDTxXGZ1Xebdg+66+QM80J0AkKolFxGa0m893hVZRxOnTiSLGeN0++Uuv4dCVGPKSSK3+XWVV6LDRvzp3gxVNL/Cul+IE0vMTRWt3mugYEB2VEQZfelIs8dDT1Ju7JKXTjMXl2GwAxEL+H3pfEEsL7swLzGd`
- qty: `kBELuVNEMjNXGmjsZnY1NYHuVd4Gffa5N+flNOu7Rc5OvbxJVBqT81dfQlT6VUfXztOZd36yOSyPRKjkhUnS+CGqlhUB3gZXbo2exPetsD4rnuVo4YHT1/c+hHF9sRmVVooHpw4KrNdbOyyKNueCYqbhjS9k8eOQ/qQZcQoNXWc2bufJ0KOVZ3EtOAUp2W+KF1Jp38C1ylv8qzw0GOV8heRB8JNnYP+lAxZHcIOhQQy+8NJgvii2j3JnxsVPIRJ7NibWbQPNulUJ3uGQiJrG0W173AtojyL+Hgxoc0+fP2i00rKOku23RwOE3X6ipZLV1U29XRke6yEl+PtUMXB6TrzHfKzTjHrWi6njnRH2qtyPlwCDb+W61FMpCUO/r9vAvR2q8MM77AXmVnLtZSdIQtqrFPQULagJwtOeJnrVktdpZjP8BHqlkPQMNfJiE2+uJ709hgEotbxqgLMl7zgXAenYpq/m/UZWzOuX+/2MTo9e9qGXM5jaHaVBTfx1WD3CguuGk8zo+SkeLP2ajMDv7l90TuFTQ/1K/GruDnosD6hkTpV2J2azDlurFKRJcnYV+8f/9xFTPLVmRqnQm31glX2z42YUNY80YiwdEWQ5l4dILVzGw7V1RXF7yAlOBwLlI8k5Qo6Q5+JkZM5WNJYcGKdAX0WSUBPm+LMct4Lt6yAfA5IJwQYh5fE3ZEgbdcyXdbSVAZzZJGXy61qFh7G`
- qty: `KJfdJgTopezGrnXm4RnJOQ39sX3qlemuZ2XI/X27i0T/RGb+O+NKzkbePuqGn0SxKXykiC0QuwBmmRdIKvDvemrs6pIIJbpnBCKXT56YT693/U1wXZv9OEZ2OUK08vVHKAfNEsv5QVMpzRq5LKbLEHdak+HjRcg4XlZVifEyd+CCc/b2X1ATBeNEmdSZOeyavCvPFiUi6bSX4uzhGsDpjFYppit5Av6/GvEpY2DhsGv2WZk+gNf/TjNHt6anOfuRhsfU8WA61iF0G4hamkWzw89oaTwTNTEhzMESKMHhPGdUyueQUS35FOknCWy+NdeS1h1ZzZx3jHLWH/Uqz5wL+NjpDN1g2ZbiEejK5w9pqty49A3njjWDLJfxjSMxAzMPFN4pOplLQdyjnqnhrbZC7lpEe7M2q6tjHOHzj8Hry0UixWQwgeUQNRlUKu6sJygy4YU/Pn1lLVLfcr1jh/xckqIibPmG0MD/69X8UNcvRZvfQd24Qbyt4ywDaxZzhHCuR3AoOZm0KPoyk9Fl6XkRfgza6Osu4QdRD/4OHg/ETSoBWq31bojUEAat38XbZntTtmCcbInAH6HURtq4vj7zWudBgx0lwmd3SPcWuOKbMlqRTNmc//vI6RgafDia/LXWGDzw/efL4Ck6ynYRdtnPP8+z/ma0e2b/Pj2oux719hmO5CL40Debql9MXBPpXG5u1k1OrgS1ZxpzPMqJ3vT`

### https://sales-dashboard-13g.pages.dev/dashboard/data/PDPER.js?v=202609030336 (13020006 chars)
- PDET: `AeOYyIb4vlqqn4GWlJOe9tBaErQTUZNHjcKrg+NyGMpHvi/NvZFgi4rMGloHVbRzcbRzXY/Bqc8yGv1BHX0rj7ycVRUffkRan6dtlKACmqd5ylxl+6mJX7Y+1D0fm7lsRse/zMxqwQ/RQhOvKXV2oto+jUDlI4CLM74ejRCVCVqfHtzSDu6nWnFYBY285VphoyLk00SDK4ZX2UqCGcyiJW9tQVXRArFevhgwNW1BiRlJD02385Ojx3TBVbr0bejJDqWu87wjSZCzY6zRa+8iNir1+reiclOlFomJ88GRcux3rdbCEx12a9fs1vPHGOmgSRCtVkWXDnbdWIq7L9I5c0W5lQezYlSp7cAwet8EPDET0G4VsSSqgY7psOH4sBGSaL0VWVusvAC/wEjphPI+ReHxoVMOjMUhjrg5qmf4+MSiY6VdB4fC0fdaL55+HaS1iuvRY2HuGiSnfZo9NGafvnIa3Mp6KqEQZdkOU3/TOdalAoCWBydhT2t7dy0azyoXzcerRe8Wj3YHLKKSqRqWPpHrVlvXoweEexT27ldLmBbZAF3ZdUwYu6YDBw3BbK3wvbt+0eG8CBZ3Xo7sznHHt4wsuuNDH4xpEVNZ9Bh6+OGKGz5fqTYKXYdXVnIUzaLgKCApIR8MVIWc00ga2kwFxFEYfyMyonMwIJFY4VZVYnoUGIsxtnGn9pRoGVFpUIRXsX2V6qQHGeSb2E6hs02E`
- PDPER: `window.PDPER=__gz('H4sIAB/rmGoC/7y9S68lSXIm9lcEriQgbiPM/BUxu8ybxUlmJlgXlZcguoVZ6R8I0GoggNQQ0EJajAARmJEGAleSZsAFBRACF/pF6uZ/ULibP8PNX5HVAljs09X3nBMnwt3cHt/jX/8J6pcd/hL+5F/86z/5r/6b/9r+x+vPqHb8/v6T+5e///t//MP/8Hd/+O/+/k/+xX8JvzEb/kZtSm3iN7jJ6yXs+/Uarn/0dsIGAP9q+5M//B9//Yd/99d/+Lt/694jNvuP2K+32refm77edr20b5NmM+Z6x+//4f/653//P9M7xG/sR57bcWzq+hNtv0Xq6y1qM/ZbxYaw22/59//0+//7r`
- ORD: `4IG15Sqxi7tJula2YhV/05Ogq8Wn8NJzZZC2VYS1+GyaENjHEkjDYUygLDn3y1oMejcZp9+HYii6CshWzkZLZ/MWXr+RXurBmLRbclDU4swNLKVYdHVuqRaBGRLtv5bfbsnqtEKJ91CyLvl07Msmg7mlf/4RpMGlSqqU9cqxlcgE/UHMcXusj5mSZ7Iv02sPHSRzEbJWZWamY0hBQ8m9ieoCzY/DrN5sp9DoLus/kF5LwunQgwJlPHoupX3BOlwP3B1+3B5Ol0juSS2fwnJYIVEI6nm4ZC3IThorG5K4566Hyw5K0etx+IG8IeWCEB+aRirhklZwO3ExU8TTEYSsgXY90wSwOVTNh0VDE75FORDAXJr4dqFvxna4P3E9N7xcmdXge+DqxLw/NIhoveOQMJWkrCpLO16ph0P2PB14DXkVkXVVP8OObpOexdcjUg/YlSu+6r+1bE3mUpZvbam3PKJIxKstgbv1NH9f+nci+fYEacoFqIyWohEIBBNSAHQvG7hzHgk5SKhT2bjhWruCYtJ8c6bId2Zff4eOwUxzHjvroft9/rRfMIihjU0Pyazzrg+JP1B9hmmi18BVOthX3tN1xl02PT5h+txNtXVrAUS92LT/9VLT6Hi34Vf4FL6dK+Y5IWyj6IBWmsdgWc35PUKs/qcTWEWUrOIHpuCsd6HwqVGLZSd4ziYGOQTR10FzNLoWqz6gbfPnFw5pw4T`
- ORD: `WUzfdeKvJBKZ+zErsCRZ4eWzKjbtUngaSksOPNvbS+nqvX6FXdChvBwzBOEGLpSpPpset6uHcjnl9J59YpMi9LNIpOObbWWZ2sENLWgThsCMwTxtceAW+UMVnR/D23ckQ7tlFuhyXVytutr7a7cCzqjtDf/2oVbvaTSdkzATSV8taP1fzbqXaeCmTTcTnULE6Rby3YBsBSqLCAhwEWgGEY0BAsaO4S+Or28WC8XltSXDvlzq+i6OIiQeZzRZ+5jJ0WPkeUnVqsAUAKQDSrhaP/dTYXu4CrK6E7q72cSeYgCkvHYfYSGIKByOxjLuM21b8cVIHI5FVxknCBb4qPMS/3ecaj2VVy3RLdb9oXrzORD86dZJjnU0zY7RnkYvSAFJdnpMguy15NtftGu6kpIpoz9U6BTqZCXCvqWlocwNnObiGYYPxnnX6/nfsjdqYep5hbIsejd9a6sh1fPbuQSNB46HOikc+0d8QMyxVX1ZVRflo+tYdvGwwPZvZw1ebJepj7312Gfp+LEqaGLb1wbBanllAezDJuUmOH+1kAsN8g8rDfeRsHcM/EWLk5SpcOzluRTY1A24595D/Zm4UcSV/Ozx9aBIoesRJWbZbKIziRIsARt/dSW6OvndQkurvZunnQjRfHvv2dwQK56nWH5p8ULBU2iHNqWWQZntkYcAxp8wQOrDWqm5sAsuejCsWrckoGr2v3NJ6y6nAFcG06c`
- ORD: `JDFFYeZW7R1QXNZ/ng0UQZrDp/pZKSSU/PKkQ/Iz3TzcGRSdk8x18rLrFZVOZY62UmXU6sXKmj3co5NIdI1GIYtBNiZpXLwUEe4IEkrsDz3AMl36Nl9X2mFC2RAVGOKTRWRew5bpsQB804LbG49lkpsp7fZSjtypB9Mm/yjMXEwJvzqV2pcFdcXEtom0FP91OYvw2/KVzKN1Srj7PN/pzTci81nNf95xAainR3utEqL5RRJaU2k9ENi5KaTu92A8B/blFsP/Zw2XcZY/tmtSXtWjrCGbtk9OCHKtUCQI9i8CMImi7U3KM+W1+2XRPIKrJb3mpC/DxIUrhYo5RiwrCEsQ3rZgoPyDM7iLSElkORDfOSxOa3jtF9MOttrOvVHXPQLa9cbGz+5bguVNpjSFKPbt9bFDrCM1T3EcD54yiJ30FR0B/bVdKYM8MYVk3Sa/cvLKjYmT2l6OcpfaQnzxiDHl3wcUhBlhYst80/ebE0SlaHUoVHIe7xLQrqWXLFSI5yj4MrQM1JO5RID5xSNzSxJGzzZ/LzfV4OMO1zR7O/1f521tSRMcjN5hghMWs6ROherUJFwQaI2LcCzix9J9/zCTPhicF6kIbXI+fhjbzra5W24aN5i7VpKX3+z59SelZaNE/RVHNaD01N4GBW3e35tajCl9YjteAMKmxrypFneWtwSh+xr3s4Tu62nBpyqmrpM89HC5rXChUagO3YY`
- ORD: `3YJ+Pr97MjmvsvF2lGIyzFb/lHB+FLLxUqkH+YFBMaJ3Ne4juShBQSoT5wbZkJq7N2/zJsmHWqjCuITKcA1JaAlgOtjRBQdts8x2XxEfugomsnmisscos4YtfpVSMaa24nUHK1v3j6PVnqwbYmN2g9mj/XrsLJOXFn3EKxdAShgyDo7r7vHyaR+6wo4pckg0K9VXAqfeWxuOQ6CzuG61mCv43JaawW+YVKPYqOxNnlOMijmY2tvkqI1SV5q6Zu1c193+S4nQTN4gNFn3BuLH/ahI1Q6sS9qVgf9sgJ/2cKPXnPgtGPb2ZcdxS1JlZALMKYeLs+w2MZcpgBjZ39nYY6jkyaaaWl09R0mfkTPWORD7g45Stb6VEmOCL7PhgWVparTW5Iez7nIyzWRI3oplLVLDNGMkpVB8v7LWKgU9g2Joc3NCUQ3CwGguGOxNVYNtRwzGCbsG9b8O0aBOHodhyuKOFweZOFDD53me29Gz78D6zcq7bMUMIreTUIy+83zTM8TccehH5dJRif9w0NBhqvBKPvgZczTJuZyrYfARBErULJX4nOEoUwtRqEcwE7XJfNn+ghFlOiPcWd3PMPMBVxCFPd+zE20K7STvhVxxJXYrCTnvbjD8wbhHjn0X1h7kEiOEBLOrXXL/gyJ6o044ynW3qp901DZ4q9N6jtK2EgemqjP1dqwpMwznhjC1BHZoUVNygNm36gpS1G+5PIw`
- sell: `x831yd+Aka41WIEWtHs2SuXCCBtf+YS90DXioxjz4GZM4yVXMTopoBLr0pLETcdasASdp6yhhqWqHW5eqjBO8o+XKBvFJfKoxpPe6Jq46e/oeK+lelM8pYC1oQ/hYou1jsTiQnab42LgRMGbqUktYLOU2JddYxKujYxUhQf5baASnMScissuIPEQ7XHZd7GZLGAs3YB+HgbjwMobeQKx2NT3D0zoZEZvG8aPtFeiKWoVaMoOxbHfXY4nsdQ7hve4EJua3A2l7EroGhhIOtkR51Qpaj0mOZUWYGE8J0f8b8qizvhcnR5N8Hjaa7hyUVsGOp5ek8czIjBff+d1Grcne3q46pHGVat9TEoXxna2sellV+jswNG3Hl0Toy5kkIOoFLOn/fhj3CKjw9h5O1dehQKCMqYcXRh1of0nxCuIM70Y67VDXMHsiQEEohM5wVMDR0sgi4NP+h87bLGQNitzlhOdym2M8NpeQl8CgI1jR4b/nGjcpDLNQwyFwnifa6rlFjj74qtjvEVj1GkTitD2M3zd4IQGn2Pg0pox43AtOxgGvN75yQjgk09IF8/SXSa8mFbxIerNhM5ObQHEqjPc/aFOjSR2mysPSN685D6wCWPKdYjMAGXAzPVspIM2WgWAdAmyId/jL/V221FO1kpUwusgoK6shoNL7IO7JspZERDtyBCp0CtNEiRu0rDyO+PJH2qG1RvJw7KrqgJmayAJ`
- sell: `nHI4RzomZCB3GUqhgNjttL7Q21Gjo9jAVdwEJF2L9+EtlYjPNdOP07wuQ8Q+PA+1jJBQlquZ6GqdaQ9pd63Z4H3eFQ5TlWYDw/9uUVJaibhq723HsVnsMdaJhrir8fm/dsntqyXzS5vBskglEocgWeDAPXfWZv6zmctIftf90rLHHNwTVYjAaJVwyDrdM0jQyWg/Bsh6Q8mqEbFu2RHRoau5sP4iWN8i5E996Vehm73tIm7Lhd+bdH3C6aTlxR+CaxK9g8llWcBDXP3WBKCPzCcJxPLC2Xz5L7UD7t61MZ/C1PR4Fw/2KQ7d47HYQvCejl0N29vwemn2LgNoLGqbbaIY6aGAvHRXn3w410snsellTCEJY9ORPfvMg8w3JVg8zhtJe53xT8l1dVpzHfR4B4iea9q5Woc8PTjJKnrq8t0baoGstMRn2BxB3Q6pukwur8AjeCsmJ35QLDHdeLqmP1zXa//pPJ7o/8BjY2zF+sb33mo1Z9x+cEg5gte0XYbKW/0PbxBS/gS839cf6k+Gx9HbJE+eNfFCQu2TisF+If3Wa5fO2Mvxs0y3omzBXAdBXhs6Q6WOsZCLrpg43j6tkjPmvbQlx3FU3Nf/HVipbZT7Xhfx3KXevE/6F5gsDFYTwyqYJUR/vjNfvsuBksvuuMgEsW7x46qOTGNZsW0u//Bq+p/wqBJTAPvJlON2dbjwsIn6xVjJf+LeQUC7oG1p`
- qty: `vb9DiZqqp5LQhoNyzUOzlVSdqBIKp4YFFjZm+HC1ebtIiSi+0YjNM/Z5d8mry+6m7WXuboA0DOyeXl/1CYg6nfAp1QQVfMOW1gOMczXqu9bK6MV2hnlvMMqtPCeU9BAZ64gaSmSAk02E/SPFYpQbdJ84Lrr/EYVyDxo6e7RENnGoT6Q9jURBXBmlVeverSXYz8Ugq1alSJekoLGJprh0OV7aauvD2ImALNS8+rAwnsYXkUDo3VYfvScW+k2cEEbb42s6//0TRXVkU74aJff3fBRtg+Vq/+w4zXHC2znZD/zDM+Lrca98ldA52KGXUdv4KaY9AqO/a19c0YoprnXWH0KJ6JqESPadhlN1+7rpqtyL0ceZm0as5zRmlJfS+FuWMrSAzKqXItSrof2Q7ZLDRv25RvA0fZVauoSDHMz0DOQU6b5LZ5FGpBXj4L/mSYKPl+ZaCw5HZmicOqd2e7iVO+xTO4kqlZ6ebJ6dtPaKROdd3q60nXprb7d6kGxFA7Ssd7r3Qa2k8AvoiZm3JcRC70oyBNs9QkNewP1C7LDWHB/eMvxgGVSlPTQIJRbsyOCjY9YR83gpHRg49FCqmaDwhXnm8/Nc+GJ6OnEmGPyuYYm7ORa+nsNaYvGXneYbETjszOnQmc86uhXqO4sG58QWNzr0u8jEBAW3b5ytP+HKe4d67x79+JBbvGh3dL0CTjC3HZ6rHaTVHn6KlBLX8rj`
- qty: `yAcV+FPip/xBR4GQCGUZBLcS7rVzFmMn8Bc5mifZ8KI+hyuhHNmSSoTLNWwTgRnjD4yZGwOxfRxxKvaM1Xc7lLiigKt2M+9ktgypEmpkP+so1qlbuCu0Bt/8l5qIyOLclJSvpsqebcoszTGT6rTFN78zzVR8kucpfNNm6EH47U9zK2q/XZWKG5s0r4/Pf/TYJNqerf3j1lnswwOzRNDL4k0u6EATzu8T8vOT3C+56t3ggX18l+JV+Lyp3fPZTsOT7kFvsfn7ph7OHSi3Wn8tNTTWk2YMSjx70L8p7kcfWQCzoESSrJGm1riRuNKjoWdSwTGrXbFKiib6sKo61DmgS3eSFYUgRk4cuwPNVWIoqty3N8JEbUxnLJ1+SqXy8lO1dwz/iiRAonv2K0Pz6iXdBDq4VtQwmZWgsP01aktQOIfB9uaCftcN3Nm1uUAJIgLfZLmfYqlLb/nPz3+gT5HglStSwzTOCl2sc6IZHOqQ7d4ci6pO5eIF4r+ae22awOV8RQmpXAWFxEHHxhwUyFF4jG7/Eku2eU4REkeLFQSGuNiP9Pd/k22KgS3SFPK8LmkBcGi6MPWLWJPox3jjQiT8y9/SIvnWL/M2mLJctOImlcQZiNj+/7R2rAgxdJGjWjqIkUPvV6cBt44Tbk7dYQcGjUkC13Ydzk3h6tNQuenL1YP15RUN2Lx8vO1suaTtQAMPOJ52w4kUBpguTlIAuSH`
- qty: `0bZ2//4rCqUlCV0wFXh1BTsas0rTtAzt8Pr4hIEWcgE7w3NLCpZdCkVgEQpCppUb8MQatiQEgUgJW6gAFkuTyMOsOUmuEgyepbLqtIy0M5wrb+7tKZ0T1WbibL4YmR9j85nYzgLFsQXk+C8FfetJMrtAjclnBG7s0hJ6+ifQwFszU+GLqEz7YWZ7hIolWtilOokvyXspJbUjXk0V31Vmfg0AtLV/p86pKb/HaYFZRnwQUSFtEzUvjdk8FDDcslfrg9DnkuY+3mB487e07tKjwpK2UWwFx0iRQAS+4iHkYyEdgKQrUNZ/SWA7nCY5Q/LMdhsdH64sc0xcNZuX/5l9YntXmyhlLWnfMROsZqpfqtyoStR9jbmtA0pWS2c608kICZ09+SDVgXYihxIodcBHtDYcy3sfOU/eUN2ayeRp97oLTrFAknVrIKJVB9Xk+wbj47Rep993Pcp73zEzbg3ZqeuoSuYzk4+iL5umLjGCKtIu5lv7fDrjQGC8IqvM2I0YGvlfEsZwYF5RtxPmM+t/YRI33EHe0doMlhzBHLXWmZwvfEzBPGNgKI/isxA+81m12C5aUUE22Rz93LLB705+wMerlDAHQudbKLEue7tAfnvH8MVFrXp4aDL/LnWoNlP78ciWG+zhS/y8k7jeFN9XLwg9bH0Nv6pQoIAL4dauIL/6ohnkX75Lm9seVQ7+3Mrja3x9ZjGk6w1/ro0OxzL`
- qty: `Ke26yqXLxpyboKX3LBDmvBHqh/GlY8LRgVsj0KGpQUVDw9kmFxGKa6NXI9gial2Bik2w9Yr2ChaDRz0JDTW/qFGRf6kcL1iMmw6Wy+VWtOqyNayHioagqY0tR2HzxUk6atee++OKH1lX/qDbYJJJzPfpLlUaHBTftNxipwxt6ipgtdxzk4XCCZW1/+juGJaS4alk/yg320l38I+/Df/6PdUKJsdXF/KHm19U6FpYjYs3VV8e/33UXVE3eycOrf3w5vmLy32tQlwwt/9vUVTk5KLyKlprxpM3V7ILxzQrexuATFQWsX1myF3CqU2GWStngKamvZc6CRnCg/qhUde17E7a85YzPeFeJZ279kZUqtypXXCOqx5MegRY99vNsWRjVqPBKTuMl5fKV3BTjlRd6x4taGz4GF+1zL3GESe2UD69+jkZ7k1Sx7p2SXnom92Ui9wQ9z5KEQUw71DDSv4Uvxh0hVVXeJjyeiBLg2pqmB6Ut2Y7VuGwPBGhNyKMSzSk+NwmqzW+J5YzwnOUHdHH3JP2+C/cE4Sj32J2oRyKCE9YTWxzixn6I+ojvVQVy6krtTGgWeBcs/1vtBmf+gNl515SBsu0zstyTy3eLdnYEFpPFrsNcW4ghmbBX/eNiycg6DhSELsaYscpORAbkmySa4qxd7InasW1nJuVCUjMcQaaCgh2aN/FrJSacEEOyEuUkpmvnywen8zKnjnlQHQ`
- rate: `mKDd3J0xoj3Apj/DVQnSNh7d97rIvFnZfN/RrJiwCHeSDNoal+mfUxn8XjPycD2Ptlk68fNcmbEkLG8wF/b+8CkVkarHATlcbnW/ZnETR3/z4SVzMjo6Z7ngWbj0XHozBudR427IsR77aMRXqst1X4UrPOl/d9O1H7POrpdBP2UFcsfgbNiG++knNNIaexloxIQZ0NUV+mkhxn6N3kQe984hMrZUNiQtyi3HXMA2JUyKwROQWOHj8RZZZSFHP9hFgKxPOjDFx+dFGrAc7Jh1yqCwU6+RsaA4drQ4OQW9z553um2XHn9K6kzZZ0sa1Prs6UFaMqg8EBvUtxCYTrFBAlQncEez00ljzZL972Z9rateZ6XN6YqmdLaoLRmIWU0CYLOM/PjQ+9Vy8Nw1h+dqcHC8P5MxGf2KMZ//8waEntqHXHEMtxdlYw15KXJNmnpkk1K5/E9mYR/Nymy0ZjaBKVIUViNPclTjVdlvPLgI2hhIF8ninzf6R2fcNkDcv87YFHkdtxMqfuooOmO2zggKeiRxSsi5tIsZf17qOPO1pdSqTU69l+Ot9fFwyNO7S1hgNvcNm4PHz61jdhWJT1+rZU4sTTuZx9bE/U+1vaCpbjXadPGUPjsa1ARO45IbjOTLmsO7FZ6o8dUQJh+cjpvg4RQWb0eX92KxO2k3BGKJyOk3O6bMCf/lgbiE0gMK1FMVJh2pM31Ue3I8j6eqtlK2`
- week: `ddEbzUgOpi8JkfkEgVYYVMpodcRmCvXkIO3sxcIP76//4//9t//Q/S5cW7g2KOAgZ9Rhy3U8yEfiZf05hbEFvQdXNuDrudwuC2TJ2uSjlSTxDsvXpvbaL2n5hTjj92JWLEUgyO1r3IB8d6XIudxrA3kHSLotHifJMwfKCaV15pgsMt1Ki7zTgEhm4o8NF10ylgMthfTjGrDEHxbR6jeg+Gw4oA8LAxQsgAvEu2CRYXUIwctlzPyLs0j1XmTKhjXHKuHLNPbykq9402NO1yWQWbrFmJxS2ZUJ836ZBMbxKNeV4EGhemMxMhjOXck/6oF7vF0Y2DE8lz58Wc76VXsB/1c3+AIetAs0FqyTpmpwweekmeghPvnGhYaM+nxZJwoplXbf8qOOWo1MT5+sYabblUyphwDm799N+i9V1pZGU3a5f5FP6dGCRvzXvi7DffpViqhaze+XIz9Co+cWCo6D+kpjaZnRUXXgvrvisJMNMi60ahExSvX5O1BfbyPm61+hh4KT6A3X9r4gNZjQRuJelrqVcW07Pj51bFZWl9BXFvpYZFpibdVlN6Z7h2UJ44OYZNuRtRO0PPj+92+Pal5zONrWp+/uZuk3VAGZmVhb3B64aeMNLEVvkVeKqhdRS+7lVFF4+8mGdQXXswlTDuUvwNLZraHeKX71tQIFRoxuMlWpJ8/9qDHEn6eZJyrXyIjc4CwStVQJrzsgF8Ct0aHp`

### https://sales-dashboard-13g.pages.dev/dashboard/data/JDBP.js?v=202609030336 (4275277 chars)
- ORD: `r+GHwg/4l8MDi0AxVX8s1hSvpUf3GyRZi5BvnH/3s/Pb7f+XjTZsa7HiH6+Y02M24PqLIPE4mnaNPSVHNcB6o9Wm3SpOQ7k4yZsmkCskTiUqSdjOKO4gZiEPdlDkrtZhqvdK9DHxXWJ68Y3nO7368d7hua3lYDEP4DhWz5pT5X6aUrp7vYVpsJI9D+ipO2dEDmQ0L043CyTT4ehNTzddfnlK3luf8/q0b5++9e/anW8dNZFRx8qqS3ZZRlJNMpITvyiLgjrhBCmBHdSIoTjdqZTeGek2QG85K2rEYksUtkj5XGZnv1R7hZsons+JdiTmvD33RgYG+vj/w22fg4vb7VzEdf2EDCQp8M5DtmvBORDcb7o4s48UrtKuvvHT+4a2LV9/ELMw+vvddZOPqukcv/2QuhCs9eutxfkqs7fpHum2av/uvQerj5QdPvnhw9snHYzGu9uSlLF8p/NkVTwTZN3JlQT9c/0SXTZ/4m9fA43DnoxtXv8Ug4rD8fCBrtGLdT6yItmS2wNcjtq1pj5NCfPEVhjbt/foRft4IgYWR6MbVqdNqMmzo6MI1rXnGftJRCHWIlg1uaOOx2R1PhK4TF0NcfMIdYrm+Sah5x3KsanxXWhTtSDbnJVNp5pxjPi1uykMZDqVTyQy0m+XrgdOGueexDRjuGhqaVgZue6O3KyzRpi9kpmYE0GeffX50ZTxq9AMI3MKA1dnRb+00YG`
- ORD: `5CI46XDA/lCfUm8L+4phM3jMLlYiZIk1prP3qwSXbhC2HssfWxJhT7uyZrz5ANxaUlxCOdU2YN3H3Pn6AcsS/fio7p/0r7NzvH1zd/+Rw5ygqUcwxpN5lu7pyrqRluB3R8zi/HonUiLAERjPYcCcW1TcN9jqYfflCR70gfhGp9zJDyEeXk0ZGxTcjlp5l5hkMYuJ8dKqT8UqX2acFcaUSjoCgbgT6Sr2Ldse8oC0mDdpDHPGDGCGZX2vNzm6jwI4OOPPmg6mFw3AKIhxH2+AW5TYew5kRMXr+2ES3moUWkdE1tHFBVAraAbrqums//9HlnXdl1+LiFP7w68vf/3Yj6qEYY0AWafktosl5jiHORDnwEeTD28zwkM3VyRWPMo0WllhFYsiYpFFCatVud5u8ybnWgUOOQctxJSe1lkvbjaL0Ucn3teh9dtFbFD+BcJSN9DEjR8dyvGv1WWl1hGBUdUCyH7NViET0bOIaKRXKAiwFVSglG43ZwQuEOPgiAepAZp8LhRnqUKjFQNPWke3hFApN+dBEjBYFWZSx6Cd0teskYL7zu6ufvzbMZZ7b92/vX9z5JWYPeOjgMDsimzJmyZpEc/yVTHaPDqwZuIwXCo8BtNckBazGrB3CLB1iKnGsS1Dkk7ehMzAg6R4WVi1jplntc9Zk/MyTJJnefYxNkcOJShDmFO25qIymoaUC3Yw89lqrafQpZUasbM/raC`
- ORD: `qeVcH2OjsCFdDzFH4C7Cj6Dew4w+zicIo/l8sDDs5GCbO3UMxsfWVK4j0NNl1lEBFgTEt/SR+WDABVxiW7D/9sPzN984ES92jMlqjaa2bnlz9HGeTXCD3HiyEYkxPXw3Gvc6N55h0LDafGh2dtDoZYqwteTpeAoaozNDLK9t9xkLyTp024rVPMgLWOnWM4Ta5jbNMlCGExZfAKS07ppdn6SkzZ2hXqkYAtoVxSPRyfG4BUz7680ruAQrj5BxW3oOUcZDa5mVbOh3lKSyQurEuFdlbSvkDLOLJZiYD8VODnRDcp7H2hd9vzpPzl99i7bu4vUngIyKGu8fDG89/GNHEwA5Y+fV58CkoY5ZuLFOORDKeJBngN2vmcts0IjgocpGa4BePSdaZG4o6rnSVn8+Ga/k8SVZB/0MTdmfskE5ULmB2q34BRQJkyYoro9eQMl7PQwWzXkjnKBLq0CFtERK+hq/qsBAaaNbJ6cAKvCCRD4lh5LyOurDXBm9vUEdyaGm+HEGwU+vK/Spru+DAueicSbttjGkxWTdP1iSVYbs3VTnuPAXh5KZh+A8amModIXDnmrUEzM5szilCz4pPMpG/T4MGNKzaXWQSbB6M7R2/LVM/6+vNQnFmIylANix5UobYKwaNkN3pjb11r4DDCtcRa3AirTscTDV2MwmNdPlzgiHmtNijAnGiyg6cDCIPM1IkSFiXqRZE/47iwBBQIm`
- ORD: `yyYyombMgKkU9ZNNAVpYwV02ZJAtykdnJIXL5EpPqZI388SVShXde+08+oghnr3IB7Vs+jg1ihhIlG9teXjjCJQowO2zr6QcxX5yBOejThOy+R03q6ITYHtTp35HHFCXRgui9yAIMwdo0IaJ00kx0uKjSUo/WjMsL8yf5AuXaoni+KIMLBfp5lK8XVZAEuoxehJcUlXQeOKHHKzZlklcSLtTwQSqEu9t64FkDUJaAhYSr12BaqKD5LYzNd2B3QE5DX7BKc4W+aEjMKAnOlRLGkLsRCLww1LF52yQQPX1ZUP/PRqhZYvYqXjX6ApGc2VQhSDb8DtlvbeoWGV/Ph1p/HmGpH9xXvahoZ65+KGrORD6EaKUNMjBZrWEdotO+LdcWLCY6EpqFxJknBP2AdAfvl75SgO3Wjgmlg8WrfU9tfJVe++yPgK0YYsNC5NSi8jcBhhqsgIa2xNI+47OfwHHUfEGD2ktX2kXwWSUKMugc9Jq5CZ7BOsvKsGCk4loYm8pMx4I+g504uLdoPzgwWCdCXwibEJm5dxE/P/rFTqCcgZtRQpaqJrFHq+uG2T0C94JXjsWGiWdeUO8tRip+9mwahsYlTMhjXG3g1xYupApGMaV9Nk7fOOi2lgo04r5iLS3kECIyMhCAtNbjVDUwz0q4AlWRbA64mWBbT3FGO52J2ITjzqEFqJPSlLuMEfS0QBHIKyUe+EctHIPBPEUH44`
- sell: `KeEI4kBlpN5GxhSChu3bWVyW9HoRNcHDLi7rtSWinX3mjZaH5QRjpHie2gHktZG9q5LGTlsUblgjIGvqzLFheINHMSDj5ZxbKBb2VUdvq8ceC1VRI6N4pzMbTJRrswJGkZMBTTpq22a6Acn6cGbBR0GpniqkFeR7J+V4wtK05a9SAybo25OkCmydKvoIxnYGbC9ezViUhOgDJFSfLAhaV9MZUMPoJQGCXqmKFka+sGsJBiZ5X3evaFr5lY4kqh/KzRdfAT/eFPX3y2QevFjAaDVkxpE2JaCABnhYjMM8ZNmWw5tyxdX9MVcYtSIfjNNXkuUTmqjQjDLzR5tYxCQ69KS97CBt189K4rPYTOkosellQjZymTjk5SpE1VRpaYTds4LwiBSma4tjzEORnHFm+Tv7CR3+KuUaTbm3YeSH5efRbM2FJKNTuQq7FmqpdMdYKos3Mg0QTwrqNzJfz5ymsG0j59pq60qQFaVKMfm0xwaOKIi3KEQitkuHWFt8c0R9KT1eCyMJszb4ppp+RFTjhVJQoD0E1pKfMkop+mpaA+McTlwFS1R1rvRVJRdTfpc3sRKCd61l2aUQ7kPokRVA3KlMwJUMgcALvNnPwQxeSSPUwnfY1UqjBAlxlyt8+74W3LDikrbGKnXVAv6avSe0FkXGWCUj0xI7anM5mN6nFucTK2ubjQ3W0Unck+pzgoYYvX8lIxsZni/cHBsSuc6j`
- qty: `7GcywjWQp4d6cElw2bQNmmc0/3Ap5yFTQ9iy8JiJ3JJ0IXYE024VPv7dJEymNAw6dJwVPM6QmlGy1NrLU1BQGttL0gNA762nAOXxHXMWiPZlAOTTzE8KDhsEKZqXzhyBu3gd0/rD1G5L/bHZSXPfQdSSfkZ2McUyjkRqjRk2lwnUA2mhqs2tu54ijmlxGNN92OQ4hP6ZBRDysaKuTFm+w7wSpINzEUKEnQ/Ar3VZqS4a4YX2o0CqQ5N2irbdWECTmRm2IwH9My5qs9sc2JgrLOsoAUY4dKR25vPhLYau8DKjVLRhyas2yvzTJDfanFZ+3a5AL/H6KMsx97YUtKs3FjC1Fj0Vfj9ptetpwVvMqty0kstRHUOYkszK+VbBGYVgSA3l7errCqw18EwslL7SIca+4y8/xQZYZKYPpQV0haPnKFYixuzvpc5M9YbxUCnUOqmMqeWYtmBRVSBuJNFjiOqJLWo3dCcNnWmTDGyMfgk7SehMUh2RojWHJiNoFK7dKIJnVLTGF/hBZ7GyZLK0JDjOgApGIWZUdxmA2xJcUNcpHtVqozo+ovHi0dub3+vxoUAO/E+6JWu+wzbrGK6GxHBMTeptiYgq7JQyHplYrmjukYG2RrXvCyvkvhWSeg8u0KthpGTsSm193MUEtou6DE0u1vfigzKyWVsfe7tycqtqjcwvztqcR54Ms/smWRFI21PxuHTvkdXNkq8i4du`
- qty: `/+/3/9L2FcAHyGdbxJSWPsYlCKLWvs+dU2KIFZzxcdHKTLCvFqv7ARGrUxgRyoKKZxgR/SZaK/rXlakxf30evvEArBi2cx30T+Tcv/7//5//9/+yfQ9fVR8mb6+ROXgFEdNX94O9KUDXpakTk8IhjTZGVnj4R9VKSNqvUmTVWJdG0ykkcJ60SX4QvO/byqk+6ziXt0EMHr8qo8Gkbl2VIegGiCdt48KCZSNEjZwOsL2S2KipB9OkZEgshZ6yGZebWlSMXXqyytx1/+83nkQyluO+3D0+uo9VU6pYtYdZ/Co8CoiPZsDSf8YB9xtpywaZHIZG+mU7atx1gGslsQD6IP/aLH8bJBhVGclEKdqCqtywo6ZVgjFwF0/0PbEdsEAcL3tXpJkB+sR8Tq7+/go64tGSkUlxuowqBUiyd0dQIxQqS/Xz4IG7ibGb5H3oYoCgFF2fLaOEqpD269Rr2aOjs9T168dtSW9rzJ2y0YYbC70K4nLfg9+qVIkSrW20t2UemNtdQnM553iSqU+mmGn5T9Hn3qAUV1tUr9I7xz9aMWrDKaX+dXv7mt48OTrNGk3un+avu8u8dCs2E9sl+5x/+5h9Wq0t+RaMz2xnJ+rS+97ff/dZ3XvgvT3vcGXshps/s5Ze/vXeHkZkV9t3SJP5ABeWCPlbkd/QXhEyhV370VKD+xGZP46Pq/ICiO5WsD0YFQpzmrtOs4ggOVX6sau`
- qty: `l0M36F4rWVdcam1rUWzMUZqvcShqH5W7CZdIPxrTmgrPnSSyYSnw2b+tJi1M/BEEc9GumqIVPOlzijQ8/lbs9zhxMaZFvsMMo2GFdU6afQQRgsQEiRq8HjKf5i6085Q5YEkS4r81p0SJVKDx16zMdrji97IW3fh7M33riYC4dkzCDFEGvRQFZlfV9Q6WidwIm2vE24U89CEUIzmWzeyTVotlrAXJ0VZ+I0DXbFPRZj3G1GB7HpbnlqW40AwDPbtvKvlQBnA034y+JGc8Oq2kwwC1FMXvJIWV9lbRjEJUyCgmCoF0Y1ADwjQgzIxYWeGWqUl9YmDsM+mIynb4he8vWhcFUMRY/MBy1D/ybnUeqty7mQ9El+bEcaN0kv4izpfKSIDtll7u5m7iteMKhvv4Y67218u/DVc7hYtehfPKq6UuTiyHsV42B1eh1j9cnjSsUNi6Z9WN7WaPRPtkRlHFmiH//oCg+fVx0uGh+4Y6jK3DhiDWKdkvEgWhmwz43zPWkp0YmGipG1jUWp64GmnRIPNM8jKmePWyDZynnfZCms5PLtXJpH7jusQCDnsRW6MLEvAXiITbheQZ/N4PAxcbmZdimNyuwjCa8Cvxmoofj+ks2l23WZPY2H2awu/ztvn77+K3JtF/yaEY+OmQyxZh5kk5SoNgZK4YqRMZnwwewrvyuGrPTFK4t1sl+M9acRbK5gP+1OsJukoTGBZQN/t`
- qty: `U375vAC5UVV5lJvYSLcAQTd06SpVob3T9Mi0bJSSGLvj8MpGJhPqxHqkXfKH4cLSwshj4z0GG0jv3aVUw86csFMCZi2uQCdSsaR0ap3+CqH+xdiclHFoIKCPlNW6I4gOkKBtkAU5ZhD0KPoEjNUAeTWKpl9CFwZapyA8MaSFqwqQR0IWE0NuchSV36ccvupQgopP2CHOvT6R2hDS6tHSefN5u3oAV3d1bILymdZBY3ZH6oW08TQBSFAbawNmGLyQYxoAnTLXJScLRyXlwtE/UvBJNTVkzvQWJTPBTpp5NClaH8IkDuBB4EGa8olkkL2YrbizCE25xAIeVRcqaLA+NCGzvJjUWyHz6igxeNHMqtySuYZpwfyQuHfJHHmRVpp0pTdpFmSQEaowueDbjfZAR6ZBP5+7aizgrLSfjjqDtTapGsG0yfCXjh9Ds0+O4JNH7+IMPvnwwFyLNkMRaX+oI2gn3+eHuYR1TkIHnFleRCwGInOCYu7D21+JXq/qX0dVj2DVGV2+jcwVjql2hzVdF2kJFWxejVfAX03KT9+qDyvTMmOLkOY2v7cQDQCa0nBkfd5MJUrrRj1Cd0ZwinR9L+26tMjqlKpBwpfB0BCOyUwOzugysBFlZc8nUNapCJtsBwrzQ5ahZfXpAOlvxnYCbqZwze2pU8AfFkyV+l65d/bKo0NzX+BuVJm9BBuxxmaC3ZQarM4ya/dLBjORtcl`

### https://sales-dashboard-13g.pages.dev/dashboard/data/MS.js?v=202609030336 (1401403 chars)
- ORD: `peqzQ01FQUnnuZJY4g1t8bSqA4ml2L6K29sZj+B9sVwCoqq4eN7APSATpaHvro/MuZ90nyuArwo+tdzOFx0Pz8+1i49Pn2i0LSHQRITyZU8RywwhyDgfRat3dR+pChWbo5h1cmCdvMP28k1OxscODz1ON0rwLlOBRqYhKXvXxnH6K/oWbr/j3KcweToHIjsb1Zd2hW8BWzmHVTs8+yscLIuSkmzDIQVurhy+LQX/F1I/S4knXQLZsTqglUdH7qQHeJj1nEU4KGRwfZWOcDbSeYl/Eluhi1dJTim+8qDQ8l7098iSr9dBv9ebIOBf7bhJL2kQ6CRo0y33i3MbVhk7fPHC3wqNomC6DwFGeT1rORDb2QIank4D9ADPrhIqudarpE7UOYi/zVcUim3G7ZrOZUMaN63IXoQCzIwk/rhNlUI7hMiZrL1RJomhWoKxSlt66BdQqJJyprrEri7s4IUZdPg7cV+X1mX1CRwAgbc04i4RV3CmX6taR4qaELuUMODR8AWd/uqarI2eSzxZGsvyNTfI3Hcg8LMyaA1E+GlzYydWz9xfhceKg++0vgWEC9m20Mr3kDNK34F0C1DX2IsUSlwSX9Kh4uzjcHtV/jTL6r1gJLVx40cmG2WKvDALge3N5qVEMuo+cjqEeWQoFUxJvw+2xWiUQgKcyW2GrU3//M1UR+uc68CDN5bnWzXKKbYnDtAaUJr+UeJVe6QJCYz`
- ORD: `tQI+3les9+m8pLDEbAxDRoKMtarYZ8vn3WrRj/VGAzVKJZdyvzc4gGpwG7UHrv3v0V1IxRY8nBRfca8N9/GnLm5heYqSWPT+LT/Yc4byP7lvrB8FFwQ/6oAmZwL7zpt/lJt5ega5sUN5ytptYfDmKrPVTDdUufzmHMa6ha+osrh6vIb1sdmdJQToaM4xmB5aHDxnu9wTme5UK0K0Pr/dm/blZuxz4crmAXvDVynWtOMdWzTDS/MX0spRgYiDS6R0oj7XKl94Ex8vxUv/NqpM6OhBJi5SczeazzR1gkiMTfW8pjBVFKoG+b+iDAkK9n4nwO9NzSw8N9b2Tv74Lep/u94lzv04Lp3TszeEy2+8ORDRilxIwQcC1G9O+Rx3JInhnwzP2FLs+lqew41FaK1PS7v5CiI4EKMXp7U06kPbdQxhMokeGfGtSVu5KOw+qVZ7yLTVL89S1/C5YZhkIhYj3QN9SJOjp/5hpXLRWJ4XpGRDvfTaotCYjTL7kv91WROyZlbELMSK5xTZXLlxnpSjvdviyO9SXuQc+3vy8qnG9yTOiSEXpaODpEinidPa6N/YOfFnv0yODZFd+HWzqDwV/YKQJGgZ+MojNMjeVhAmL+GIv59ZhJ5Pp1o45flNvjWjcf1vxbuWGccb8lml+tPxLNrv7fePwca+179eNhSbKlCiNR8qXCj2nPDWs3b/qfouThFT7ItN2b4kySTxDKu`
- ORD: `360nO6AheoveVcDNM9o6ufKamdYHEle4YyQ9k69RjYLRyR2n9cyjeW5j0N71pXwbnSmEMWJ955UJEYRiJqGeNumaughV8tLvzUjCQeoxs/iboWI8SxI+nv8WXIdXNL7k8yOagGhohvh6ZbUmFw0byqGFDCndtQYVNBV3f7hMuA5iOjYZKx1uuax9k6kBEIzNCW7G5oqco7ncob3UCYjGdz2zUwcjUoMGdPkLfhjJVvdlCX7Ew+5B+f19dss+wMj1ZFY7+Hf9kDLx9KvkbQq6zGnkjye2E5ovale7MTXcyWYkGORWnSMk44uuZA1Gr64oeaQ0/4XeENVqcTdH3SQ+KGkcf71oc1meTMHQgALzORDgR5d0WC9WJ+snNm5Z2l7jl1NV/s4El/uvI1KTK/MPiz7+6x3X9xUeLjL8/O4dxv2WKGAzfTYb5UxYnoMTXfCI0cGKeuylM7JVzU2pnLqrkI4wlU9Nuz7kKgP54jJ3TyBpVztKfOusJH32BbIPzQo4lYecA2tWsvtr8eBlTlL5RReepLlsikpT/bZ3tAzpdO7sOuOq0K2z0l/gTTBjbMlc1CLVXC8/RKMzrnMJKdDXdl7wQpJE2grP+Xe/FCc8RVz3/5ZOXv/1voTf9eCfkHzlRYVvGPoNzBNoh7MKWZTLGskG5KV9VCMymrPm2FAA/S+Kf1p1/P1v3eWddSrz663u55BfUQ5+QMPe2rtQ4Bo`
- ORD: `n43WOoUBPhlONtZwcM7Twz8uQrfM7dc9kMH1d3cbNfAdplnGW7p2n3UBqPxEAyWjyVna4oeFuyfk3fHThmdYkd7a65/SujE1zAnFDf3G2SNWXHuR9rr0zkCiNVH9sprBwFHPtkZOcT2pcNoO8rMghd54FkN3JSurVhdfN/OnL8B387CDdyGvt7ym4qUPIDBkJxP7sYzLurDdNumf2LcsYB4BIl2KUYdlluDoSjVl57Fx8RtEwqwKssZ96542htjq6VJtd5m42yEtWjk51MAR8STbMyUB7oqtO++UkvWLcCbIZeEzlCCTa2whU83IwGO1GmC65hn9tR+NbgDViSWzRmRw9I2oBXPLyg+UR1WmORDRqyqFL4+cggYmvjma4+jx0PqI06oWcYGEVZa/ifaGZ7TdGo4tjiv1O1kEwpJjvLP0TvEW+2hO8tXK4E1WXWSwNjLGT95sctH1EtB5tBLSmdHfKfkx1ceWcSlWNjxc6CG4lTXUPcNmsmyT/GFSW5trfxF27ZGWSC+QAJfilGXsoj+svlLixYJIJ5Ch5d/5MLLLRIIjcrjjpddBkcwTX7ZaA4xGgTJtkUegx08ficXm0WLbkhm7d0jLblsJ4hRV0wcIlgpvsIaO4oxXBjSy6Ux92t6RKceNtm5ltk70U3xHq0L0rdI8wSKox9tFAsr5bcKZWMxuhPJKX2fk9izptEfm+QGEWLJQsZ+bMtBBbu8`
- qty: `qY9J2Vn/ihfa4a5GzHmLVoreAZqswneXkY82edzbM/b7g0k5QHAd4DW2nt4V1Wx0M1Xb8Sb8uTAxfZ9EyF7u+r6Py7gm77NEjDtJeP35TLQ3Abg3eF7P24yCcTbz3iy+efGV3XxNprfKEbIZ9jtbEtUy2IdKYaFgqr8bLtwCGGmCWbQ3PYK4nswZi/nn2p/aeN4a164uIVwpgnQHRJh6xiPrmmIaW04xh3XY6uVsinsFND5gE79oE00KoekltN1W33O91knxzxnp9uIv2z0MJYo9Ovvcrww55C2zxczcMdWG01L1CtbpvFuVK2U4n50I+Qn7UqR5vKJLaygeEkR4LwrB4sUMFJk+xs3YIB6pqtynQCcGVwQnLHe5OEyKaTord3NYZmKXToM1gXhvWPmlg8UPHJ7t3UAYWD/UUaJU8k6ckwH1WYrJhNSbnhmE1DTMWaX8E1BYPgpjKsfslNs2KGb1FwbpZnp6AxhBO0gbHmxJMOK+2LeMSaWYz9LbeNhVewh8xsM2sp3rLQnECUnw5K44aGodJ9Oo1OkTkB5VQiN1/DwPNXdzyf1Q1x6kZXmpmaxxDRlKpmZ5qGASG20MGM7HGzSzM1SUy//vtTzL/hxANMKtE2sMeDlSYBlPOKzJsAaT+QRMy6Y+pPg07EdRmtogrJ7LoZDZoQxXGO4/3bxmdxOgRFZlpGbS7qfXQKgObB8V19z3qIKRUS1lI+d`
- qty: `UnKnbT/yw7oU9hsY0zpGGlTc0awV+gPG/S4Xs12tAw2wOWm/nCkJNDWr/LU45Nytmv3+KRpb9bik7JGBxBhlvQkAwnH2U9/ppcEaJNhVJOyM4NSZoGKr1Jw1IVhUfVzhKyqBFX6B5njXoGnLAiT1RFNs+b6XB45IOErcAWYbh6KSCVBezTuVNyUsULEbnVZohITt2uQIp4NqTAZstjDXRUPFHijzbUH65BSts1TNwHos/sFBPbGPC43MRkaAWA2tVVnh35O1KKJAHeSQDfMoAHhvmVnNMzG+H1bjADgC01tXtf7dArwBi5oVQAq6Z2Yl7wUyTrrHneshVjhLVv6+INHQidqfVl1kmvTo8IC/qty9uqjbktnl8PBMLnN8jj0iWIO2/Nifi94L/TvjcapkwCx3WZRlRxmQH5PhdPokm7wn/wteWM9CumXK6pFNd+QMmbjDNlwx0fKuXVY1/RhycZb4amLlCaf6O71TFL30ECRuZu1K7sroN5LMN5VZ9pTP2UdGUnyj1w3qLV8lhPbn/QUtd0DZXR6rF2Dz39iIqd9Zlt1763SELdoYQ4PmrHtpl7aQWUDW/Jwxy2br9eVUnQKDwZfpzhCBztGHIUGcwij26gV+iTYh/8hdONDBVBwDB5ha/vcSmG8h90KOAt+oP/5Vs5q8cw8G6ufC9l/vhU42IjDdFn/eit7zPdOdurvjch3cBuBhAkdhM96og/1`
- qty: `GxSrLTnrdKgp1uuxrmrk0FSBJSml+ky41ESRjLTnsFoT1Q5GkUxFdiiIUepzvf+368LX3NnKJhtPLZ4+amfChmI79M/m06TD+kObH7FPtoXCRDPSlvzFXOGHdMDCXkNecsGqoPeiwC68Mg6AHlxDbs2e47XLA/ervd6EAB6L6C9F/DfLwi91hL4Drdl1xbC6OE5z+pbysxeX4H2yDddFazZea+Z7V57yz+I/uZnzZW/83+bmSPWHuhEeeonxXIrRaXcdJZtKoVeHxw+yyI5T0vI2w4Bv5F68cVOpSv9GlnZ6C+3uJb8vFX44ubOfXfslzabC/D9k3tMcBA7+oOh1TAsHdsstHz6jn8a03ztTqtyZzFVqnCMSpo7v79ypkZvMIl5so8icQFNHeZcEbf4v1/nDUuSwzLLXSEIrXgel0YlfF9xCt0Cis2PvdzAcu4x+0d8WSNDFzK9I+j7jyURSldJy0/7ECzw0MlH7frn3e65BZi9M9+H4qAUym5fifX+T7xr60bF0o3b/Tzy/XOVh8jzjt5bAkIOg0DztD2rPEFzvBEaHfTn1xshPv15U5jv/qKMqBj0EePylA4OFTzp9P9wS/welDAokUuaeejhR60/N7Y13ZeRoVRm0Hf/w5p/0j/dEW0ay88dwaZ7l+1Jk8ow2tEKZ0khn2dzc1jyK6jRRm8kkyY+IF64axybZFATt4cAUmuO6ROR8NsP3ksk`
- qty: `N9aJuZRNd2uxvj3Jj07i6PitA0pAdM4bv6IWHRxgB8jvv0hy5EhBehEGw/8b96ru9iSJZox2W6XNcfd77DeehgQdHKxqZbxn/JxUXxWhe+P80yfyXqaAHOYSaVu3iNejKHaX/lHEFHDbVhFkF7B4YDFp7kMmLyFZiJujVLwgQ0mYjtSUP7wxgaHEoMKuJ5idMH6NqwabkqeR+hmn+/FvfLfckwSlNzt7acLEpPC1IQlnWT0kkcbf+BYaEBlU9ypi7XuSemofCqDhfUQ4TmgsHS5HMtDuWImFicqTR03e2qWEhcGgN4M/uPslhmtpKCH1IhD0oAwX6cL5Kres5qhLaxBHkDioa3ks/cyLZt5uqtyg95UFMzbOfmGOo9ZQuYZKKWKe/pINHm9eCQl0zBB3SgmYArRV3QQaStwKBLvWvpmEhk7azNfmPQNHVS2Lkwfp4cKxtvuDCVp9LetFy+1CFnqwrnL79iSz7vKtm0VgzaVsCipBEe4PaWMQA1wDdCv9Sg8ifjHkN9JIDOPPGFnjT1UsFatCINamSTLwuEYbtaRAK0b/QO79Z7SrfuItiNVri4vp2ji0Eep6bNc+5mncpWd0xbIQvMmy22uqSFby5KWVDgJrux1s4Vxnq/F5m+M4eSVnabfTkCDtgQjoNy9wkydMHRnzvr1p6OxFCEfX+Y7aFkxzx5+MpNT0v8uy8SAjw9s0v2FS7KKoMourIQ7`

### https://sales-dashboard-13g.pages.dev/dashboard/data/SUMHTML.js?v=202609030336 (283472 chars)
- ORD: `0GSM5BvHPCX3wIWckVydl20FvvD8f286qYmZ0DOXc6GpVcDs8myHACuysLsz0CG/uVjpu6qXrTsVqplbXe5lHOJJBK9gA2GLNm6/9XKdwh2bULT38QjUDq03vRIEdZsDUdbULVuzmfYRZgdXWHHjaq8IClNDTriNp9XI87bV7+l9ish10pEzlu1BYIkrocAGihJ51486JEkP6KSFKaHfn2HZMlLBLRQkc8/HOLkpAZas7mhGebpIoAbvS4OyiRCi3ksKxVxcunm2neze+ts3SJACbJnEetp1VvbOU0yRArkmEXnm/XJMA1YNRJxElqgoK8HIICidXAqApAU0JaEpAUwKaEnBhbDuEumBtY8wORDodcQ9+/TIAQMneBCihAoCl9WgA1x9rl5MA9FIJwLjVvbnn625CJ9uEIw1g/87ECI5/Lg3gVbVVMso1JoQViQCl0XfQO7BLRQDfo9c5EcBXFwGwkAjgL5J/t61EsgS84V/vXxAF73q4d4GDd7ll7ppQdy2KJa6xLYov8a21Mekaky7DpCMts9wdOhM9cpdO7H1h3tcAs4h0WkR28gn3ULDcUJZ1TAaaTKRDJcRNHdIFTHZQPsLk6clEOpn1jlIzyHxWN6/v7X1WelqkRugkIcssfkPjxWLaR9lG60oTd39dl4mNSVeXSYeieXSJxWV9zhps+Fce5zPpatvhRrQ5NdkNp24dhugnydlz5SLSqH`

### https://sales-dashboard-13g.pages.dev/dashboard/data/IMG.js?v=202609030336 (4997501 chars)
- PDET: `7z9/onD2yYvcrUNV2S1u3DMyvxRz/vetik4qLOTQv49gih5bbMzqJwo3hH6gIRcegHSfA5nJ7dmM3HC+7JpeEBtUeMsm7yAYOQIdBcIdWs2NR77uDRULV4YewZ2/p1swFA6z8EztywSEIqlGIe6fzr8Z2ER//AAAAAA=", "CO2502ST80": "data:image/webp;base64,UklGRkwCAABXRUJQVlA4IEACAABQDgCdASpdAHAAPpVIn0olpKMhpjYLELASiWkA1JAJXZV2PjKmiVbDdAtgmf74iWK4ah8gSPO6dcxcXZmAq85dUXz0H7sq1IO+NG9B1WrUEAc5v9sDn9kcYcmfsADRe+qPDET5xnO2Be6YHJc+eB9tV4g7RjX0QEaqqFAA/vgTES2oJKUPsIb3j5h9S47ZcYyGdxzZIt+zeFhlnF2QYA7983mEkb+rwejZN5sm7YclS5NhpC4rwusGFXETSrqXjFReinWFHcgFvakd/573rylkIdrhlELphSOg8dmVPZ0Cg9u/cMEP+FRq8OV+bLNtVI2KNvMG04bPCt7fxih1dErAjWO5TgBWdZXwQPOyKaQJLBXLJ1H98oDpiNcFBB22oS5U2yQ1VRXMj/5p37LQPbOzZMYkNCYduqiiYcmU/214Zndc2z3MdKWzk0j9qL5nOjzZoeL7D6Kit67YZcYtbVcC9LY6efMbZXoXQP+29J5/yuj`
- ORD: `bT1U2SupJN0yigq5ulM3Jdc1U2GwKeznVw3dRClYqj+MSC6clD4DyLlVKmRKTHMnCP/pYRDu+JbLvOAOVS4HpigfYDSlZqIDcHx4l25LH3enxIEA/s3PRsQUTBKXScYkRjwO5/n108SL+N+ApVhmA4U9SUKie1TDN1kxh8GobNYvF5auuJSoyX/agrGsSdT8IIkDuCLPYbsCmyUaTH+B7uGrp7cODlNsPlj3IebnA/774AAAA==", "CO2402SN70": "data:image/webp;base64,UklGRjgDAABXRUJQVlA4ICwDAADwEQCdASpdAHAAPpVGnUulo6KhoxQLyLASiWkAFeO9lFePv17TORDfYLYZjZ8/r549En1P7Bf8o/tZPDr9fr3wzWNw6h3dhYUjL/+q0rUUGITanN+rsa7aj0ZFH7ZaHMvuexVX9nKxXzBLVzb8k6Z7gkJhlpClt8p1/3UVlztVmZL45ah6QdmTdRKp4QlpM8rOPYNBpsT+4AD++raAGpLnKrdEnKb6XrMbZeDHpUoqmDksKgWi05cRe+r8DglHfCj+3pm0P3kU1ZhP7/v/zd0pO/kXf5+DEewlE46Hm7+1Gf9zrMF/c8ctQJBXhAFPremAt8TJPh07+C/jdKt597DwWDBveSt971jHdy+LAVcECEbYaN7t9yT1LDGXg94l4YN7jMPIUgOdCSJSCuKv7KLsKHZfRl4`
- ORD: `6fNHRJtdH3xOo1W2o7MYSHPW8hVrCuuBpw0Rj6u9c5e6zkRQNNWAG6fIgzE/6D5WVAQkvOOA1McWibN+TaI3scGE1ueJ2qq/cQABOFYScfnL3A8HLiNPbUgkSrsxihFmi0Lvg2yFLIAAAAA==", "CO2404DP77": "data:image/webp;base64,UklGRrwDAABXRUJQVlA4ILADAABQFQCdASpdAHAAPpVEnEqlo6KhpjIMsLASiUAZzCi0b9Ge3S53HTcyQZuEcUq2Xy1xGYaPjvB/cbpw4dJQVtDkG3RYiE89Y+m/phoxXTe+tihx99Abyx3o+e2sLWvCGPnvhwckPq+au4nSJtAesUORDKQwcR6Jum3rGsTRvbRmuItMyqWNAxIMHxfHGnzg+EH+2R/CVrMz2pGB8wx1ZpAKsLGLFbTFOJRKOPrnpAtpQ0ubAAD++yGAYm5u16laSSV08HwatjzTI2smEvJaQnwcwmmV4y7n6aK9j/U2g2P31qNsH6Th44SrK6XLopsvR1eeEJi3yePqm1xVY1kB2ugrqGm5UdmmXQCHQrcP+q0fRVqncACJI8W70E89xe2Y/4lh7M+5VqvrZHMgRkCU+3Otf9r4Kkf1RHcYYnpMKTb3zUmX0oTKNb52Rmj7K2ekT8NWbi2aH1YAN03WHDfLQd877nafVMuwFebc2EngDv1DHlvayOIu0x0/2VgyAmCVY`
- ORD: `l8+f6BlvcCgitHFa5K8Mg4FQKE4riFy7+h9gxeAH3UEo2yjNHbShWsAPnGt7wpISlybmFoVtkuFkvlNMyUlOT3FU+rTenc/PeJYJckeyc9AsV3DV29CpVyCpCDVJSxzKJxM1vJ+DF0LYnxLxFXuGCVSmvm66NdJGRhf0awcwyeS8M813wDc43t2eVJlMS+iaNo8Ff8YsxmN1lH5VqPynITYZPM6lv1tH+zf+q1Am9LQj7P1yOEiDMAAAAA==", "CO2501HZ37": "data:image/webp;base64,UklGRpICAABXRUJQVlA4IIYCAADQEACdASpdAHAAPpU+nUqloyKhqfJ6wLASiWUA0aGORDG5dUzynLvesOjal3zMaGoTcGjlWqB6f+T7/15ta/hY9c9haYwbATdDTGLQboqvwLuTma0L2rslIynpF9vHH0z/RrbpIhN4NZMN1xZyjzshHE1fiSvfRCFGj1zQEcizW05DZXoJQpDeOdbqbuCqgAD++NwpEs1ezoGEoWmWjn35Dt1+tIRt6QFP96FxdYm0D6vZ+PzvW2J8wNc8wTKMZnzI6NgVZblLUdl1/J/NlQD7kpibd0opa990pMu5DE1Ey0zYXapfJkRyz/1dqk6Oa7Gf2oHIGDP1xK77ruVN++e10aS5MT3QxJdCypeTLqNVvZvXV4dGsV8s891hBMosA3Nf41M/e7QRUyVct9vhAR`
- ORD: `mSx0eeJaC4Y6t4TCQs/20wSP8xDVniyReayczxThFh1yfma3vvoi6FalX29w6fSuHcgeN/6M6mm/yXC6UEkO8T4OErWYh7ZNIzf+q0i8CFW9Oi7tE0AGbQaQZDTpmZ5HYHqxdv1tLmnlF3zVFM20152p2VHDPUMDGBRcFAmejdbymf1GCaOTlAU8XF2ctIErJ8efC7ZfQwukTsqCGMhQdNfWQ8yDwu2yaoaD2JICJ75bzSb1y33+8op/pLnVC3pzqWWmUpvdAQFi99mlPq8fXmtuXuT4KOYml7JFMmfWwehZvS5GN33qFWxdIvEtYxA6OuD4JDPPLvvkrHobYFUNXH/55QIrudiXZw5LN+UGORDoC5bJQCFCxQr45dUSaKN/kVox83CO9H9lMntVPH1mCHwDuhelZXz7rmJ9HVFL7N6ATXnccasB8tu7lwUjrbNdAMTF9roTx7DnDxR9ppprHUqBqsvPoa1nkTUasfTvbzVrYdQJXZClgQXmoo9n3LcB6yTMdynoHzFlagqHeARmI6zntgeZG2KBEPvYNFVhVBIEIeDVOJg+oaUPkt5SLFspgxL96QAAAAA=", "CO2507BPS1": "data:image/webp;base64,UklGRloCAABXRUJQVlA4IE4CAADwDQCdASpdAHAAPpVEnUmlo6KhKrN62LASiWkA1jHe1YfORJ0nSbjqvVz0biQ/yAdVSt`
- ATOM: `kRvADXAVcjOjm1wrc9wu9PxwKqgYx2GyleVrLiIqPauvUvzIZ0VLYLBMHmYljrpIU2xtxhRnuhywvQZRqzY5R24wrw40+NrvB7CaGSr0EOWOyVmp9z4z103LT+w2tHn6iUCreSYbT2FYzcBSmCRmpMs+bgAoidSsRWssEP0aQzSR5GCk9VKBi5khgx6RiG9x/XP/O/HyyghXI682fhj/gelNAN0AbTmSlRmNbMiORJUC0nh48QQPqOZNc5ydaWlQldBSIArDOrVDo6FHRdDpzrWb7pV3S8xAuZJ7ZAnLdkoxbK8LjBPyixtF5EJVYSfe5qF620FRs16/VOKmk3tlYZhmlRiReb3Em0jyveavATOMVePWOC5hDtGcjcoheXPogSIzFKaOG4XbUa85fPFk+gYYZj5EqspOe5vMPeVMi6jfX5VEkAwr279YWXSAmFpT5j5pieg3PWRLQ5O71Bkt9lJf4lUqBi75QgVdnVS+MTTMPoJVJZ0trzw1z7uI4MT40rV8ahxQnCaLiY3lI25pytJ9UCIoAICwSqCJl9tC6rm0RUbjiSfJnEJDwimTGH+yeZq+J0+o/N16DZ+RBEawEpUHwpogTTKT1v3dMerW9YIEVRqLCo6vu3ApGw6UT1E7B1Hf5mcxrpYBbPPCsWhbgHw2kvKpDB0Pa6cAXJi+kkxhauay452kbfZ68pAc94/gMUqklkToTdradzoFQJWr`
- qty: `03BXthtBUO38+xVHFYjNxSjPdmen+kLCDQ3TlNHSR6i4exryM7vhnWRzIN5nlCALHhWQllTPpHOrx45dCUvRafj3+B+QaW1GlhwgFvOtLk7ND+20XWgVtleCR67E6MP3JtO0EJ56sDniKCusUWrbrXBYQclG2AAAA", "CO2302SS06": "data:image/webp;base64,UklGRpIEAABXRUJQVlA4IIYEAACwGQCdASpwAHAAPpVCm0qlo6IhqTN7qLASiWUAynDWVcihOVUQ160RIeXDuLKw/oDHg3pDL6OpeO22WGQlZkhwFSmikDybEw5ku8346m9uHjZ/7RY73xMJ4EZNtbk/1Ht8qfqtyROX+ymiYmiQvK5zfpJiAXBTY3fbOfO1GO8gWg2W+17qo1ORhMugpuLs4rBkYvLlQWzgT1dtphAeycsvTh/ymqBkN8lMvUwpzK+qByu+WHkl4X/3Gv//+u7sVUrMrP6091j2aK68+EL8pkRwJbaZWbgAAP7w00imoiW70gLmXu3AjNnhDgGxtNtNIZXvtGgaf5kNlNXDodZZ9yti37qDsdeYO3fzzrAc9kKdi3W4SbLWeAMjsxJcMi1VJayGjmVG5AcxtQ4HodCnhK5OZGsfKcEfvp5VKZ0lnpBtepeJUUuFw6czc3P2GKDBN8/MMXlvgAHBwNn9GTau82/DhwKeDp1rb7VlJGnpezovEp81r`
- qty: `HeDGbernAD4S/ST0l+Wko0apS3YgM0rJl7bmD8Gk43UMAAAAA==", "CO2303JK07": "data:image/webp;base64,UklGRoIHAABXRUJQVlA4IHYHAADwIwCdASpwAHAAPpVCmkmlo6IhKJO9iLASiWcAzmz9Pq3kXji6afkkta4r7Q48uYY/Mc9LLtADxadLL1v7CDDN1QBwB1uS3FbRbTQ3xS0qARzButBrnNmmlvi6fs97tnxPgB9cTCX8WbTghPcw1MmSvZLuKt6rK/zqarqUsq1vCh9nVB91+eEPWC/xSvMAnQtacrkBMO0/I1WuWF6IYXgpggIcEwisizl/4zsbco1euW3PRek3qtyqJV/X0035OL+ZHxljeOvfK3v2PWy1Nfk1pXxqVAVJSv4ST4C72N6OiCdi/5MZ8FQbKK84BOQTVQnrpewKCDe2EzdMWLq7p5N9QqRiiIJNPfUnJ+bfFczzcbY0LP90Kn1zpxDns7RM6jh0NJchc8qIAAD+7+5je7qrr7lVovY8v2wf/jfzCPRt9nwKc1mN68QS46KvC3x9HqlnpWK8JkaZv5ubJFfVgx+jvi16r8SWKxntPrz6dEKuwASlIg69SaBHH4ZJnuG1eY3AIlb8+p10jSVPRqiejL6ZyqTa/RDexNI/F3WecXu1qB+x7aRIKcQl9oDB9IQlNDv6oUlSnxBmA/v1XJf5qGgDjZqzskF`
- qty: `AACQEgCdASpdAHAAPpVEnUqlo6Kpp7TbATASiWcGe9UVl6xYC5cC89wG7/eGpBisU9BEVTISyN0IW2CFOXwTAiQgi16rnkwdTaBagS35PMwSf/TqUt41lwg/pVyNNMQu8MOQNhwPkcgCJ7OzKPkWdBmTvuKtl/rCJztQZ4M76kjodkVDkuJZf9uSbLO0HA6NiM+O65vAia5QpOJguoQAAP7wrT+0tIXY1QysXEP/++eFU1y5SES1MzXOeGYjPrge6eFYO+EuxvRkStq7Vd4+KwQawAP7THmoYANNPgFf5ZcuXet37PQysPJwNIN8LZGwyyoEmLvJg1WofA6OMtGy6yr//G2Cs/9UEU945GNkqtytm3kAcnlsQdnD9UNeyO68qNn5PmJSVDsBVtNUFJ73yKhAXsTSZ3jeaYyP87ynK6j6Zb+JfiPxuF3tALnbZSwlFl7LYw7lZVGgEQQ/76HczJDS5ikDaC98n1SvhRBJiylVRtdSZ8hHp3ygq1dZbykeBi1d88f2xal7m2jpQhnjI/wuyCBWT3c3gayfeyCudGowMj6rzO7jhZdIMcQYbkr1Gi3GSObN1HpkV7TLseqmzLPgl+1VfqWpEp3+qOPolJnomXv/h0JbizDQgxIRKbKXwTgCwdR0EgL4IBAZ0mk/WK9RwiB7Bdpr5WzJ6TSc4NT3XyVouiy1VW9WLwXDqK0qALVdQZT1tTFSuKlRSgP`
- qty: `OZLjEZTsHIFaydlhTU2L7vDBmoDjQyEJT+rRfInS4arjd46Aab/ua3TAdHZeshDE1TniWIZM/0G7okupvs3L57EhGcsB6mCNv56DaNTcK3f6YswCLzbhaxCHkK5dA9KwEQN0TtmDrvemXCeoPtuZu9afpFLfKpGptuA3UINF8QM4bboK1ORW/Yayg9jbvWZc9M0t2xcWVyrZIqj1GMMmLC2Wv5EhyJlsyqkpUARUW+FTvOut20yR7ECAR8OCFUsf4hu0Vi5y/4LwXJ294eI2rlfTlgHL2FtL1I6T4e7WMWTH6NgJbpJPPCYPdQ2LqamJ/sN3m8s3x+ex6TgA2QDTIUSXGsf2Y0adbHLdPVyrqtyp4MAiD5ACVN/5OMK3h/bC4iQJQE4ZCpgoP4TZBp67JdBAVdG6DALgfFR5TV4e+xKvMxyq585I/5Y/62uM6nwQmdxHYpwNUcQsY19qHM2N7n+ryL3cnhJOUB6wF4sJ199zQZe1bZcnw24g9K0/4j8MLIyz4OytaSc8xAqxrP/SLxuAucF4mlJUCOPwzji5l9tYfRvgWpCA598my1Y3rSVgVQ3ybWtiehy2QKs5C5KxE0FHsYa6lo3nfy2dg+pUTNyQE9XKRriyts2V17iochTyBDgw/AVz1FpCzlcOaNYBQg/2IpAPU8uaS5Q4yemRW1I8cYTnOCe0O8K8cRJ0Fa2perRwqVAdZmkJnfmqUwH`

## Visible Period/Freshness Lines

- 커버낫·리·와키윌리
- Snowflake 동기화: 2026-09-03 12:36
- 1월 1주차 (12/29~1/4)
- 1월 2주차 (1/5~1/11)
- 1월 3주차 (1/12~1/18)
- 1월 4주차 (1/19~1/25)
- 1월 5주차 (1/26~2/1)
- 1월 마감 (1/1~1/31)
- 2월 1주차 (2/2~2/8)
- 2월 2주차 (2/9~2/15)
- 2월 3주차 (2/16~2/22)
- 2월 4주차 (2/23~3/1)
- 2월 마감 (2/1~2/28)
- 3월 1주차 (3/2~3/8)
- 3월 2주차 (3/9~3/15)
- 3월 3주차 (3/16~3/22)
- 3월 4주차 (3/23~3/29)
- 3월 마감 (3/1~3/31)
- 4월 1주차 (3/30~4/5)
- 4월 2주차 (4/6~4/12)
- 4월 3주차 (4/13~4/19)
- 4월 4주차 (4/20~4/26)
- 4월 5주차 (4/27~5/3)
- 4월 마감 (4/1~4/30)
- 5월 1주차 (5/4~5/10)
- 5월 2주차 (5/11~5/17)
- 5월 3주차 (5/18~5/24)
- 5월 4주차 (5/25~5/31)
- 5월 마감 (5/1~5/31)
- 6월 1주차 (6/1~6/7)
- 6월 2주차 (6/8~6/14)
- 6월 3주차 (6/15~6/21)
- 6월 4주차 (6/22~6/28)
- 6월 마감 (6/1~6/30)
- 7월 1주차 (6/29~7/5)
- 7월 2주차 (7/6~7/12)
- 7월 3주차 (7/13~7/19)
- 7월 4주차 (7/20~7/26)
- 7월 5주차 (7/27~8/2)
- 7월 마감 (7/1~7/31)
- 8월 1주차 (8/3~8/9)
- 8월 2주차 (8/10~8/16)
- 8월 3주차 (8/17~8/23)
- 8월 4주차 (8/24~8/30)
- 8월 마감 (8/1~8/31)
- 9월 1주차 · 진행중 (8/31~9/2)
- 당월 08-01~08-30 · 주간 08-24~08-30 · 전년 동기 매칭
- 와키윌리
- 월 누적 매출 실적
- 월 목표 진척률
- 정상 / 이월 8월 누적 · 전체 매출
- 이월 30%
- 채널 구성비 8월 누적 · 전체
- 오프라인 그룹별 실적 현황 당월 누적 · 8/1~8/30
- 매장	실적	YoY	목표	진척률	할인율	이월%
- 매장	실적	YoY	목표	진척률	할인율	이월%
- 매장	실적	YoY	목표	진척률	할인율	이월%
- 백화점 TOP10연 목표 기준
- 백화점 TOP10실적 기준
- 업데이트 2026-09-03 · 영업기획실

## Candidate Controls

```json
[
  {
    "tag": "INPUT",
    "id": "helpToggle",
    "name": "",
    "type": "checkbox",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "SELECT",
    "id": "annPeriod",
    "name": "",
    "type": "",
    "value": "26-08W4",
    "text": "1월 1주차 (12/29~1/4)\n1월 2주차 (1/5~1/11)\n1월 3주차 (1/12~1/18)\n1월 4주차 (1/19~1/25)\n1월 5주차 (1/26~2/1)\n1월 마감 (1/1~1/31)\n2월 1주차 (2/",
    "data": {
      "mdd": "1"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "8월 4주차 (8/24~8/30)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "1월 1주차 (12/29~1/4)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "1월 2주차 (1/5~1/11)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "1월 3주차 (1/12~1/18)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "1월 4주차 (1/19~1/25)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "1월 5주차 (1/26~2/1)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "1월 마감 (1/1~1/31)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "2월 1주차 (2/2~2/8)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "2월 2주차 (2/9~2/15)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "2월 3주차 (2/16~2/22)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "2월 4주차 (2/23~3/1)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "2월 마감 (2/1~2/28)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "3월 1주차 (3/2~3/8)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "3월 2주차 (3/9~3/15)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "3월 3주차 (3/16~3/22)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "3월 4주차 (3/23~3/29)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "3월 마감 (3/1~3/31)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "4월 1주차 (3/30~4/5)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "4월 2주차 (4/6~4/12)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "4월 3주차 (4/13~4/19)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "4월 4주차 (4/20~4/26)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "4월 5주차 (4/27~5/3)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "4월 마감 (4/1~4/30)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "5월 1주차 (5/4~5/10)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "5월 2주차 (5/11~5/17)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "5월 3주차 (5/18~5/24)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "5월 4주차 (5/25~5/31)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "5월 마감 (5/1~5/31)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "6월 1주차 (6/1~6/7)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "6월 2주차 (6/8~6/14)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "6월 3주차 (6/15~6/21)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "6월 4주차 (6/22~6/28)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "6월 마감 (6/1~6/30)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "7월 1주차 (6/29~7/5)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "7월 2주차 (7/6~7/12)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "7월 3주차 (7/13~7/19)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "7월 4주차 (7/20~7/26)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "7월 5주차 (7/27~8/2)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "7월 마감 (7/1~7/31)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "8월 1주차 (8/3~8/9)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "8월 2주차 (8/10~8/16)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "8월 3주차 (8/17~8/23)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "8월 4주차 (8/24~8/30)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "8월 마감 (8/1~8/31)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "9월 1주차 · 진행중 (8/31~9/2)",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "⚙",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "p_sum",
    "name": "panel",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "p_bok",
    "name": "panel",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "p_jang",
    "name": "panel",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "b_tot",
    "name": "brand",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "b_co",
    "name": "brand",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "b_le",
    "name": "brand",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "b_wa",
    "name": "brand",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "s_all",
    "name": "scope",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "s_dom",
    "name": "scope",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "s_ovs",
    "name": "scope",
    "type": "radio",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "통합",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "통합",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "커버낫",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "리",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "와키윌리",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "전체",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "전체",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "국내",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "해외",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "통합",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "통합",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "커버낫",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "리",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "와키윌리",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "통합",
    "data": {
      "g": "brand",
      "i": "0"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "커버낫",
    "data": {
      "g": "brand",
      "i": "1"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "리",
    "data": {
      "g": "brand",
      "i": "2"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "와키윌리",
    "data": {
      "g": "brand",
      "i": "3"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "당월 누적",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "당월 누적",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "주간 누적",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "연간 누적",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "당월 누적",
    "data": {
      "g": "period",
      "i": "0"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "주간 누적",
    "data": {
      "g": "period",
      "i": "1"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "연간 누적",
    "data": {
      "g": "period",
      "i": "2"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "전체",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "전체",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "정상",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "이월",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "26SS",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "26FW",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "전체",
    "data": {
      "g": "season",
      "i": "0"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "정상",
    "data": {
      "g": "season",
      "i": "1"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "이월",
    "data": {
      "g": "season",
      "i": "2"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "26SS",
    "data": {
      "g": "season",
      "i": "3"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "26FW",
    "data": {
      "g": "season",
      "i": "4"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "채널전채널",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "전채널",
    "data": {
      "g": "chan",
      "i": "0"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "백화점",
    "data": {
      "g": "chan",
      "i": "1"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "쇼핑몰",
    "data": {
      "g": "chan",
      "i": "2"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "아울렛",
    "data": {
      "g": "chan",
      "i": "3"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "면세점",
    "data": {
      "g": "chan",
      "i": "4"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "위탁사",
    "data": {
      "g": "chan",
      "i": "5"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "직영점",
    "data": {
      "g": "chan",
      "i": "6"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "자사몰",
    "data": {
      "g": "chan",
      "i": "7"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "무신사",
    "data": {
      "g": "chan",
      "i": "8"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "외부몰",
    "data": {
      "g": "chan",
      "i": "9"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "기타(온)",
    "data": {
      "g": "chan",
      "i": "10"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "대리점·기타(오프)",
    "data": {
      "g": "chan",
      "i": "11"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "해외",
    "data": {
      "g": "chan",
      "i": "12"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "온라인",
    "data": {
      "g": "chgrp",
      "idx": "7,8,9,10"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "샵인샵",
    "data": {
      "g": "chgrp",
      "idx": "1,2,3"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "리테일",
    "data": {
      "g": "chgrp",
      "idx": "4,5,6"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "기타",
    "data": {
      "g": "chgrp",
      "idx": "11"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "해외",
    "data": {
      "g": "chgrp",
      "idx": "12"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "전체",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "전체",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "봄",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "여름",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "가을",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "겨울",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "전체",
    "data": {
      "g": "stab",
      "i": "0"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "봄",
    "data": {
      "g": "stab",
      "i": "1"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "여름",
    "data": {
      "g": "stab",
      "i": "2"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "가을",
    "data": {
      "g": "stab",
      "i": "3"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "겨울",
    "data": {
      "g": "stab",
      "i": "4"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "기간 누적",
    "data": {
      "g": "toptab",
      "i": "0"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "급상승",
    "data": {
      "g": "toptab",
      "i": "1"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "통합",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "통합",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "커버낫",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "리",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "button",
    "value": "",
    "text": "와키윌리",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "통합",
    "data": {
      "g": "brand",
      "i": "0"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "커버낫",
    "data": {
      "g": "brand",
      "i": "1"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "리",
    "data": {
      "g": "brand",
      "i": "2"
    }
  },
  {
    "tag": "BUTTON",
    "id": "",
    "name": "",
    "type": "",
    "value": "",
    "text": "와키윌리",
    "data": {
      "g": "brand",
      "i": "3"
    }
  },
  {
    "tag": "INPUT",
    "id": "jangSearch",
    "name": "",
    "type": "search",
    "value": "",
    "text": "",
    "data": {}
  },
  {
    "tag": "BUTTON",
    "id": "jangMgrBtn",
    "name": "",
    "type": "button",
    "value": "",
    "text": "전체",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "jangMgrAll",
    "name": "",
    "type": "checkbox",
    "value": "on",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "고수빈",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "김기백",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "김병찬",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "김보나",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "김성훈",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "김솔이",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "김지영",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "김지은",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "김태봉",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "김태윤",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "나홍윤",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "면세 공통",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "박진성",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "배나연",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "배나연2",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "신경락",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "신형모",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "엄혜리",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "위탁 공통",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "이동훈",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "이민경",
    "text": "",
    "data": {}
  },
  {
    "tag": "INPUT",
    "id": "",
    "name": "",
    "type": "checkbox",
    "value": "이신지",
    "text": "",
    "data": {}
  }
]
```

## Schema Notes

### PMETA[0]
meaning: 연도 또는 시즌 연도 코드
status: INFERRED
evidence: WA2602CD52 샘플 값 26. 실제 영업 대시보드 사용처 확인 전 production mapping 금지.

### PMETA[1]
meaning: 시즌 코드
status: INFERRED
evidence: WA2602CD52 샘플 값 SS.

### PMETA[2]
meaning: 복종/카테고리 코드
status: INFERRED
evidence: WA2602CD52 샘플 값 CD.

### PMETA[3]
meaning: 판매율
status: INFERRED
evidence: 3710 / 5200 = 0.7135로 샘플 값과 일치.

### PMETA[4]
meaning: 정상가 기준 입고금액 VAT- 후보
status: INFERRED
evidence: 5200 * 99000 / 1.1 = 468000000. 실제 코드 사용처 확인 필요.

### PMETA[5]
meaning: 입고수량 후보
status: INFERRED
evidence: PMETA[8] / PMETA[5] = PMETA[3] 관계가 성립.

### PMETA[6]
meaning: 브랜드 코드
status: INFERRED
evidence: WA2602CD52 샘플 값 WA이며 key prefix와 일치.

### PMETA[7]
meaning: UNKNOWN
status: UNKNOWN
evidence: 샘플 숫자 관계만으로 의미 확정 불가.

### PMETA[8]
meaning: 누적 판매수량 후보
status: INFERRED
evidence: PDET.ch[*][2] 합계와 일치한다고 확인된 값.

### PMETA[9]
meaning: UNKNOWN
status: UNKNOWN
evidence: 샘플 숫자 관계만으로 의미 확정 불가.

### PMETA[10]
meaning: 상품명
status: INFERRED
evidence: WA2602CD52 샘플 값이 실제 상품명.

### PMETA[11]
meaning: 현재 재고 후보
status: INFERRED
evidence: 재고로 보이는 수량 값이나 PMETA[5]-PMETA[8]과 정확히 일치하지 않아 코드 확인 필요.

### PMETA[12]
meaning: 현재 기간 판매수량 후보
status: INFERRED
evidence: 주차 수량일 가능성이 있으나 실제 코드 확인 필요.

### PDET.srp
meaning: 정상 판매가
status: INFERRED
evidence: WA2602CD52 샘플 값 99000.

### PDET.ch[channel][0]
meaning: 실판매금액 VAT- 후보
status: INFERRED
evidence: 채널별 첫 번째 금액 값. 실제 할인/실판매 금액 여부는 코드 사용처 확인 필요.

### PDET.ch[channel][1]
meaning: 정상가 기준금액 VAT- 후보
status: INFERRED
evidence: 697 * 99000 / 1.1 = 62730000으로 면세점 샘플과 일치.

### PDET.ch[channel][2]
meaning: 판매수량 후보
status: INFERRED
evidence: 채널별 세 번째 값 합계가 PMETA[8]과 일치.

### PDPER
meaning: 용도 미확정
status: UNKNOWN
evidence: PDPER runtime summary를 inspect 결과로 확인해야 함.

### ORD
meaning: 용도 미확정
status: UNKNOWN
evidence: ORD runtime summary를 inspect 결과로 확인해야 함.

### ATOM
meaning: 용도 미확정
status: UNKNOWN
evidence: ATOM runtime summary를 inspect 결과로 확인해야 함.

### IMG
meaning: 용도 미확정
status: UNKNOWN
evidence: IMG runtime summary를 inspect 결과로 확인해야 함.

### Known sample
meaning: WA2602CD52 runtime sample
status: INFERRED
evidence: [26,"SS","CD",0.7135,468000000,5200,"WA",5225,3710,19600,"우먼스 릴리와펜 라운드넥 반팔 가디건",1253,170]


## Source Usage Search

Searched loaded same-origin scripts/resources for PMETA/PDET/PDPER/ORD/ATOM/IMG and related terms. Snippets are deliberately short and do not contain raw data dumps.

- https://sales-dashboard-13g.pages.dev/dashboard/data/ATOM.js?v=202609030336
  - PDET: `H8TDQPHEapfZtE1jhxMgfNbl9AazpxrZl5g4psPBut9xxXNuz6RZbZoWV6j+3SRvvyQjNwPSsD+tBNETPDETOmc/WM9GF3Omvur0jAekyPkL/j4s/xYjDAdPzDpW43ySjjhnCu4TRPlyVEkzjbDkac/tam08gdhuwVaSljCGnw4wJ1v5b6QU9mxwbqtMRFZ2kpGLRmIhMqXQe/T7VewtQcNEa7p60GdryMZoQrwll1dxcGLS`
  - ORD: `sXWaQu95xUw240p1bP4eSYCY4EosRsxNjcKwZxnfFdZQLE4XZb8xfiMQEhEdQs6eP4EbkJ50nEDvYImPORDE2Gx5K0Yy5Knh9YB/qc4XDAMlooTC0N2xmJ5ROP7CE8QyO455BdBrSCkCLN7ZOvY+jAHY53b+gtqw0wTKAWbtJqKkTYIbuanGZBSOSoedoonEY6fRWeCgbv/Aw2g1Hxm5Hje/elCnCDnEIH9Y6Mzfw3KF64FR`
  - ATOM: `window.ATOM=__gz('H4sIABfrmGoC/5S9S64ly7IcNpfbXgvI+EewJwmCAFEABZA9QSMhbk9TUEfqaBiakzgIhbuZR3pE5t5Vh4/v1Tl19l4rMz7+MTc3/6//ivVf/+G//ut/+R/l//63//P/+G//1//7//0//7f8y3/+L`
  - IMG: `67F+8A87xlemB6kPcX/89jAal5CcW58HDhF/QavO4+sS4+MMwDRBlfsx2H+9ptuLFWzJ6uHdkk1angh7IMGHEux6gFvpoJgFvEX89qO7YZSjOHQ7t1T904GcvO02VQQuhf8N7WBaLE+/ANBGlebZr2gFMQRXH1/RKy0+vgoLh3yWZmNafbzCrNH07f2N//2/wzcui7gKyK4NcbeVEE/PTIAoQA6xrdg4fDpK1h8vSzmTYosc`
- https://sales-dashboard-13g.pages.dev/dashboard/data/PMETA.js?v=202609030336
  - PMETA: `window.PMETA=__gz('H4sIABvrmGoC/6S9XY+dx3Uu+FcaukqAHeGt76rBYACRkuNjyRIh9kl8FPhqbg/mboAB5oaWmw5lUpYMtyxaoiTqhJIoh55QEp20Ygr5P+rd/2HWs+pr1fvWbuqcxADT/NB+dlWtWrU+n/X/PndV`
  - ORD: `HtQtv0qaaD8v9HCjcggITCa/sshdeeo8UtGrjdvG6XsO/nqwzNpNKxYuPFWIql7gAmbMMQ0SJjlqFAX3ORDj0ADM6V/pjpGbSFG7ueVRzwkmLoLLK3Hw/PwMUAtZUtG4XVEb9/v97Hq7K2oirFIfUWEo36vb6ylle2SxlNmeDEscV+12qot6ka6qI65jxvXjFstQjD1Wa/Xphc+YCeVFV7Vprcz1w2qKH7yRYyQwnDdCi+q1`
  - IMG: `vYo7De7gizIUJPeoiky/9CeWrauuMpnEa+LNfvvP2Oz/jfbLjy4fkU1/m1dWpohabpXTfwmLuRbt2QBtIMGjyzDJqPJ93927h9EoHSZbo+uEB9lU42ZBJcNQMdTwoC90zbBvp0TXD61CHW/eWTlJZgeNrpbUycVQjjFVnw6G+1rlnNDkaHbjavorYH4ZA2a9nqIcVOi3JVDrHUY3whgPIV5Kg9pzJu/mOc/LvDxYiAIWbkzn`
- https://sales-dashboard-13g.pages.dev/dashboard/data/ORD.js?v=202609030336
  - ORD: `window.ORD=__gz('H4sIABvrmGoC/9VdTa8lt439L143HiRR1Ed2cTuJ7ThxI+2JgxnMajD7QYCZTZD/PudIIlVVtrurOg+GHcfGfXXvq6uiKPKQPOT7x2dvv/3sN//47N13/O9//e/ff//9Z7/5jxpzLCpFykt+E2uLqe`
- https://sales-dashboard-13g.pages.dev/dashboard/data/PDET.js?v=202609030336
  - PDET: `window.PDET=__gz('H4sIABvrmGoC/5S9u8522ZEedisGIxtoNtb5MBmnSYFgG5oGu6MxFClxKNihIGBGGsOBHciABpBsQ5hAsGVjgjEwMCbwFYnNe1AdVtVetWrt7/tMBvzB//3fd+91qONTz/PPf/FdCiF+9/uYf/En/`
  - ORD: `5P9P+8e4xllT4zhOeXWejYvv6t+GCzKptqDytjgbE2lymLxwkPiiupxNWgBWSscSJzWcd6RyYh5P+ftMORDLRcSzEB48rB6eLXD2XBYPnCxlduFB6gSDJWdnmAAu6F+lXtISrDsp2CpbGZU2WdoVZxVS5KbowUhy8KPDioqqQHs4wke1W/kCsTXL1lGQjVA5ioWPLl2HPKCmxEUzXdzoFhdWDRJv8gfYLd4VDC9JPcQoa7bp`
  - IMG: `h7mJe0VDZtHmFHy/9p2nAT5Qd1/Qo1kSlDPfLcB8Vu7UgkC55fLLiLLHrHAS+aoeHIkGmJFsX/7Pq0XtIMGkdLQBnHivyBkwhsZlviU5Ayc3mK5V7EzIEuC6j7pAmLNN7uIKcW6NaI2nFqMdYRxmb1yu9YPLtQfUSWijLS2jNiH6UkzxvtLhAxvidTlqJTTkVgS6R4OHIARj/tpcsXxBKNMWohomywDuEKRD12xcy3tS6fLo`
- https://sales-dashboard-13g.pages.dev/dashboard/data/PDPER.js?v=202609030336
  - PDET: `+reiclOlFomJ88GRcux3rdbCEx12a9fs1vPHGOmgSRCtVkWXDnbdWIq7L9I5c0W5lQezYlSp7cAwet8EPDET0G4VsSSqgY7psOH4sBGSaL0VWVusvAC/wEjphPI+ReHxoVMOjMUhjrg5qmf4+MSiY6VdB4fC0fdaL55+HaS1iuvRY2HuGiSnfZo9NGafvnIa3Mp6KqEQZdkOU3/TOdalAoCWBydhT2t7dy0azyoXzcerRe8W`
  - PDPER: `window.PDPER=__gz('H4sIAB/rmGoC/7y9S68lSXIm9lcEriQgbiPM/BUxu8ybxUlmJlgXlZcguoVZ6R8I0GoggNQQ0EJajAARmJEGAleSZsAFBRACF/pF6uZ/ULibP8PNX5HVAljs09X3nBMnwt3cHt/jX/8J6pcd/hL+`
  - ORD: `6nm4ZC3IThorG5K4566Hyw5K0etx+IG8IeWCEB+aRirhklZwO3ExU8TTEYSsgXY90wSwOVTNh0VDE75FORDAXJr4dqFvxna4P3E9N7xcmdXge+DqxLw/NIhoveOQMJWkrCpLO16ph0P2PB14DXkVkXVVP8OObpOexdcjUg/YlSu+6r+1bE3mUpZvbam3PKJIxKstgbv1NH9f+nci+fYEacoFqIyWohEIBBNSAHQvG7hzHgk5`
  - IMG: `dXZpsi3G3/+ZZgW9FYzXfiGzgaPjJ6f4sLslGuVQ1zTD2LWDecyhmilupYpHPIb/znwdbL2YlpNU2QDFIMG9p2Rg+9a5ivMSNvE/WMKXB+q+nx1O9AifhRd4T24HEUautQwOyuOTn3wi5eCeR8V2OYjpIzHaq5tzwhfDNCbjgqA1QzTEznf4enT11Vq9lP34Ys+oif5Bwk9YOYEnSbj9clh24YNImcUbcNsEmmGUxckI3yGb`
  - sell: `aj0mOZUWYGE8J0f8b8qizvhcnR5N8Hjaa7hyUVsGOp5ek8czIjBff+d1Grcne3q46pHGVat9TEoXxna2sellV+jswNG3Hl0Toy5kkIOoFLOn/fhj3CKjw9h5O1dehQKCMqYcXRh1of0nxCuIM70Y67VDXMHsiQEEohM5wVMDR0sgi4NP+h87bLGQNitzlhOdym2M8NpeQl8CgI1jR4b/nGjcpDLNQwyFwnifa6rlFjj74qtj`
- https://sales-dashboard-13g.pages.dev/dashboard/data/JDBP.js?v=202609030336
  - ORD: `Gek2QG85K2rEYksUtkj5XGZnv1R7hZsons+JdiTmvD33RgYG+vj/w22fg4vb7VzEdf2EDCQp8M5DtmvBORDcb7o4s48UrtKuvvHT+4a2LV9/ELMw+vvddZOPqukcv/2QuhCs9eutxfkqs7fpHum2av/uvQerj5QdPvnhw9snHYzGu9uSlLF8p/NkVTwTZN3JlQT9c/0SXTZ/4m9fA43DnoxtXv8Ug4rD8fCBrtGLdT6yItmS`
  - IMG: `tLfHR7Rs2wI9B6eQ1GvGd8Id8zoTSCjWpS/bKfuc6CBEjqQNQA6U1QW+R90kq1TUeZNpWOQe0muIMmPoIMG7icZxcQNXP/0rBNGB2rVuxcukxsEXGuOQwdncWyC18UGlUDwi80xSno7r8QKuRs+/ARowZKqOX15YUBXgD2Qg0jgAeqws6Zq9I5+wntFhI8g9jAkBlJ3TSvU6NnlhsjzG1oklmuJO4hbAN2QVYu/dcTsagf2X`
  - sell: `xpE2JaCABnhYjMM8ZNmWw5tyxdX9MVcYtSIfjNNXkuUTmqjQjDLzR5tYxCQ69KS97CBt189K4rPYTOkosellQjZymTjk5SpE1VRpaYTds4LwiBSma4tjzEORnHFm+Tv7CR3+KuUaTbm3YeSH5efRbM2FJKNTuQq7FmqpdMdYKos3Mg0QTwrqNzJfz5ymsG0j59pq60qQFaVKMfm0xwaOKIi3KEQitkuHWFt8c0R9KT1eCyMJ`
- https://sales-dashboard-13g.pages.dev/dashboard/data/MS.js?v=202609030336
  - ORD: `Eluhi1dJTim+8qDQ8l7098iSr9dBv9ebIOBf7bhJL2kQ6CRo0y33i3MbVhk7fPHC3wqNomC6DwFGeT1rORDb2QIank4D9ADPrhIqudarpE7UOYi/zVcUim3G7ZrOZUMaN63IXoQCzIwk/rhNlUI7hMiZrL1RJomhWoKxSlt66BdQqJJyprrEri7s4IUZdPg7cV+X1mX1CRwAgbc04i4RV3CmX6taR4qaELuUMODR8AWd/uqa`
  - IMG: `UxZTK5gLdAgrekVTxbk8Po/AkGelk2bXgez7dECEe1pJTVWeNZ3uF4dBc/63AV6EdJsVi3OSkbpuP1ixIMGmQTiELlHTnvRs0UEI+3BGfQFpzlIZNN5aownuJYkNf951HI0+5p0FbfKduQ/TwgzmAgXXmgETbAV/llvmbT8bmQZCpDBF+3KeoY95IZwv+i29yJKdX7AB18QYIeUN5y04Vq922IPQ2eT4IrJVYuB59EsF/FKR`
- https://sales-dashboard-13g.pages.dev/dashboard/data/SUMHTML.js?v=202609030336
  - ORD: `bJnEetp1VvbOU0yRArkmEXnm/XJMA1YNRJxElqgoK8HIICidXAqApAU0JaEpAUwKaEnBhbDuEumBtY8wORDodcQ9+/TIAQMneBCihAoCl9WgA1x9rl5MA9FIJwLjVvbnn625CJ9uEIw1g/87ECI5/Lg3gVbVVMso1JoQViQCl0XfQO7BLRQDfo9c5EcBXFwGwkAjgL5J/t61EsgS84V/vXxAF73q4d4GDd7ll7ppQdy2KJa6`
  - IMG: `MKOne9hyft/0+zTDslncYbKzkgAzSOZb7PS+G9D7SGX8psyiFFhNL7Z8n6YiD4vhfazi9DBnRsWQjErgIMGJSe8Ww/s8KGGymaUouRrSIp8eerij++6KF8oAckCZGHzGAi3YrlbsbyBefLSrWFs6oJXLMjeSpDWtpCBObCne2K1C9wCqAJxIudMkn54NwuSOwuTujBLykuNFpYC2S1VLyGwyyUkZWODcQJzC4zpMGasmnMnM`
- https://sales-dashboard-13g.pages.dev/dashboard/data/IMG.js?v=202609030336
  - PDET: `miVbDdAtgmf74iWK4ah8gSPO6dcxcXZmAq85dUXz0H7sq1IO+NG9B1WrUEAc5v9sDn9kcYcmfsADRe+qPDET5xnO2Be6YHJc+eB9tV4g7RjX0QEaqqFAA/vgTES2oJKUPsIb3j5h9S47ZcYyGdxzZIt+zeFhlnF2QYA7983mEkb+rwejZN5sm7YclS5NhpC4rwusGFXETSrqXjFReinWFHcgFvakd/573rylkIdrhlELphSO`
  - ORD: `e64,UklGRjgDAABXRUJQVlA4ICwDAADwEQCdASpdAHAAPpVGnUulo6KhoxQLyLASiWkAFeO9lFePv17TORDfYLYZjZ8/r549En1P7Bf8o/tZPDr9fr3wzWNw6h3dhYUjL/+q0rUUGITanN+rsa7aj0ZFH7ZaHMvuexVX9nKxXzBLVzb8k6Z7gkJhlpClt8p1/3UVlztVmZL45ah6QdmTdRKp4QlpM8rOPYNBpsT+4AD++raA`
  - ATOM: `7pV3S8xAuZJ7ZAnLdkoxbK8LjBPyixtF5EJVYSfe5qF620FRs16/VOKmk3tlYZhmlRiReb3Em0jyveavATOMVePWOC5hDtGcjcoheXPogSIzFKaOG4XbUa85fPFk+gYYZj5EqspOe5vMPeVMi6jfX5VEkAwr279YWXSAmFpT5j5pieg3PWRLQ5O71Bkt9lJf4lUqBi75QgVdnVS+MTTMPoJVJZ0trzw1z7uI4MT40rV8ahxQ`
  - IMG: `window.IMG={"CO0000CA01": "data:image/webp;base64,UklGRpwCAABXRUJQVlA4IJACAABwDwCdASpdAHAAPpVKnkulpCKhoZgLyLASiWkA0yxGLp816G+DtLwSvKi6BvqIiOQzQsmWj84yqdxFLYOXy2+cbVzKR`

## Freshness Candidates

- Snowflake 동기화: 2026-09-03 12:36
- 기준
- 기준
- 업데이트 2026-09-03 · 영업기획실

## latest.json Field Mapping

| latest field | source | status |
| --- | --- | --- |
| sku | PMETA object key with PMETA[6] brand cross-check | INFERRED |
| name | PMETA[10] | INFERRED |
| category | PMETA[2] and SKU regex | INFERRED |
| season | PMETA[0]/PMETA[1] and SKU regex | INFERRED |
| gender | PMETA[10] name text heuristic | INFERRED |
| sales | UNKNOWN; PDET/PDPER candidate still requires dashboard code confirmation | UNKNOWN |
| priorSales | UNKNOWN; PDPER period comparison candidate still requires structure confirmation | UNKNOWN |
| quantity | PMETA[12] or PDPER candidate | UNKNOWN |
| inQty | PMETA[5] candidate | INFERRED |
| cumQty | PMETA[8] and PDET.ch[*][2] sum | INFERRED |
| stock | PMETA[11] candidate or inQty-cumQty candidate | UNKNOWN |
| sellThrough | PMETA[3] | INFERRED |
| stockRate | 100 - sellThrough | INFERRED |
| wow | computed only after sales/priorSales are confirmed | UNKNOWN |
| sourceUpdatedAt | visible dashboard text: Snowflake sync timestamp | INFERRED |

## Production Gate

Current status: STOPPED. Production sales:sync writer stays disabled until required fields are CONFIRMED.
