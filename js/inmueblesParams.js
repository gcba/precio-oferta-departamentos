USER = 'gcba'
CARTODB_JSON_URL = 'https://gcba.cartodb.com/api/v2/viz/2a9fc828-92e4-11e5-bfa0-0e31c9be1b51/viz.json'
BBOX = [-58.534235, -34.708906, -58.329524, -34.539576]
CENTER = [-34.615753, -58.4]
ZOOM = 12
COLORS = {
    "divisions": ["#0088e6", "#1492e9", "#2b9eeb", "#40a8ed", "#55b1f0",
        "#6bbcf3", "#81c6f6", "#95d1f8", "#acdcfa", "#c1e6fd"
    ]
}

INDICS = {
    "usdm2": {
        "short": "Precio promedio (USD/M2)",
        "scale": 1,
        "long": "Precio promedio inmuebles (dólares por metro cuadrado)"
    },
    "hab": {
        "short": "Población (M)",
        "scale": 1 / 1000000,
        "long": "Población total en 2010 (millones de habitantes) - Censo Nacional 2010 (INDEC)"
    },
    "area_km2": {
        "short": "Superficie (km2)",
        "scale": 1,
        "long": "Superficie total (kilómetros cuadrados) - Cálculo a partir de cartografía censal de la Dir. Gral. de Estadística y Censos (GCBA)"
    },
    "hab_km2": {
        "short": "Densidad poblacional (miles hab/km2)",
        "scale": 1 / 1000,
        "long": "Densidad poblacional en 2010 (miles de habitantes por kilómetro cuadrado) - Cálculo a partir de cartografía censal de la Dir. Gral. de Estadística y Censos (GCBA) y Censo Nacional 2010 (INDEC)"
    }
}

DEFAULT_YEAR = 2014

DEFAULT_COLORS = {
    "divisions": "#878787"
}

LEGEND_NAME = {
    "divisions": "Divisiones"
}

LEGEND_IDX = {
    "divisions": 0
}

SUBLAYER_IDX = {
    "divisions": 0,
    "points": 1
}

TBL_NAMES = {
    "divisions": "divisiones"
}

DIVS_ID_FIELD = "id_div"

DEPTOS_DIVS_ID_FIELD = {
    "RADIO": "co_frac_ra",
    "FRAC": "co_fracc",
    "BARRIO": "barrio",
    "DPTO": "comuna"
}

DIVS_FILTER_MSG = {
    "RADIO": "Filtrar por radios, fracciones, barrios o comunas...",
    "FRAC": "Filtrar por fracciones, barrios o comunas...",
    "BARRIO": "Filtrar por barrios...",
    "DPTO": "Filtrar por comunas..."
}

DIVS_FILTER_LEVELS = {
    "RADIO": ["RADIO", "FRAC", "BARRIO", "DPTO"],
    "FRAC": ["FRAC", "BARRIO", "DPTO"],
    "BARRIO": ["BARRIO"],
    "DPTO": ["DPTO"]
}

DIVS_NAME = {
    "None": "Ninguna",
    "RADIO": "Radios",
    "FRAC": "Fracciones",
    "BARRIO": "Barrios",
    "DPTO": "Comunas"
}
DIVS_SINGLE_NAME = {
    "None": "No se ha seleccionado una división",
    "RADIO": "Radio",
    "FRAC": "Fracción",
    "BARRIO": "Barrio",
    "DPTO": "Comuna"
}

AREA_WEIGHTED = ["hab_km2"]
NON_WEIGHTED = ["hab", "area_km2"]

TIMEOUTS = {
    "add_div_filter_tag": 1000,
    "remove_div_filter_tag": 400,
    "filter_buffers": 1500,
    "filter_divs": 1000
}
