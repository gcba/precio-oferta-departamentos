// requiere todQueries.js y todParams.js para funcionar
// vars globales siguen el status de los filtros y selecciones
g_divisions = {
    "table": "divisiones",
    "sfField": "orig_sf",
    "areaLevel": "None",
    "tags": [],
    "indicator": "usdm2_2014",
    "displayLgd": false,
}
g_tbl_options = {}
g_divs_ids = {}
cartodb_vis = null
g_pending_actions = {}
years = []
current_year = DEFAULT_YEAR

function main() {
    cartodb.createVis('map', CARTODB_JSON_URL, {
            shareable: true,
            title: true,
            description: false,
            search: true,
            tiles_loader: true,
            center_lat: CENTER[0],
            center_lon: CENTER[1],
            zoom: 12,
            legends: true
        })
        .done(function(vis, layers) {
            cartodb_vis = vis
                // layer 0 is the base layer, layer 1 is cartodb layer
                // setInteraction is disabled by default
            layers[1].setInteraction(true);
            // layers[1].on('featureOver', function(e, latlng, pos, data) {
            //     cartodb.log.log(e, latlng, pos, data);
            // });
            var map = vis.getNativeMap();

            // add a nice baselayer from Stamen
            // L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
            //     attribution: 'Stamen'
            // }).addTo(map);

            // now, perform any operations you need
            // map.setZoom(3);
            // map.panTo([50.5, 30.5]);

            // set the map empty
            // do_map_query(layers[1].getSubLayer(0))
            do_map_query(layers[1].getSubLayer(0), "")
            do_map_query(layers[1].getSubLayer(1), "")

            create_show_points_btn(layers[1])
            retrieve_divs_ids()
                // retrieve_stations_and_lines()
            relocate_cartodb_overlays()
                // create_trans_list(layers[1])
            create_divs_selector(layers[1])
            create_years_list(layers[1])
            create_main_panel_hide_btn()
                // create_buffers_selector(layers[1])
                // create_change_indicators_panel(layers[1])
                // create_selected_indicators_table()
                // create_select_indicators_panel(layers[1])
            create_panel_indicators_hide_btn()
            create_legends_hide_btn()
            create_legend(g_divisions["indicator"], "divisions")
                // create_legend(g_buffers["indicator"], "buffers")
            set_legend_container_hidden()
            create_download_image(layers)
        })
        .error(function(err) {
            console.log(err);
        });
}
window.onload = main;

// random stuff

function create_show_points_btn (layer) {
    var sublayer = layer.getSubLayer(SUBLAYER_IDX["points"])
    $("#show-points").click(function () {
        sublayer.toggle()
    })
}

function relocate_cartodb_overlays() {
    $(".cartodb-layer-selector-box").prependTo($(".cartodb-header .content"))
    $(".cartodb-searchbox").prependTo($(".cartodb-header .content"))
    $(".cartodb-share").prependTo($(".cartodb-header .content"))
}

function retrieve_divs_ids() {
    $.each(DIVS_FILTER_LEVELS, function(areaLevel, value) {
        query_distinct_cases(DIVS_ID_FIELD, "divisiones", [areaLevel], function(data) {
            var filterDivs = data.rows.map(function(row) {
                return String(row[DIVS_ID_FIELD])
            });
            g_divs_ids[areaLevel] = filterDivs
        })
    })
}

function create_years_list(layer) {
    var query = gen_distinct_cases_query("orig_sf", "deptos_con_divs")
    do_db_query(query, function(data) {
        years = data.rows.map(function(row) {
            return String(row["orig_sf"])
        });
    })

    years = years.sort(function(a, b) {
        return Number(a) - Number(b)
    })

    $.each(years, function(key, val) {
        if (val && val != "null" && val != "none") {
            add_years_li("selector-years", "dropdownMenuYears", val, val, layer)
        };
    })
    $("#dropdownMenuYears").text(DEFAULT_YEAR + "   ")
    $("#dropdownMenuYears").append($("<span class='caret'></span>"))
}

function add_years_li(idItems, idButton, text, name, layer) {
    var a = $('<a>').text(text).attr("href", "#").attr("name", name)
    a.click(function() {
        $("#" + idButton).text(this.text + "   ")
        $("#" + idButton).append($("<span class='caret'></span>"))

        if (this.name != "None") {
            current_year = this.name
        }
        recalculate_divisions_indicator(layer, "usdm2_" + current_year,
            function() {
                do_divisions_map_query(layer)
                do_points_map_query(layer)
            })
    })
    $("#" + idItems).append($('<li>').append(a))
}

// panel de capas de transporte (puntos y líneas)
function create_trans_list(layer) {
    $("#capas-transporte").change(function() {
        var names = $('#capas-transporte input:checked').map(function() {
            return this.name;
        }).get();
        // console.log("changing...", names)
        do_transport_layers_query(names, layer)
    })
    $.each(PANEL_TRANSPORTE, function(key, val) {
        add_trans_li("capas-transporte", val, key)
    })
}

// panel principal
function create_main_panel_hide_btn() {
    $("#close-main-panel").click(function() {
        $("#main-panel").hide("fast")
        $("#open-main-panel").show("fast")
    })
    $("#open-main-panel").click(function() {
        $("#main-panel").show("fast")
        $("#open-main-panel").hide("fast")
    })
}

// subpanel de filtros - selección de divisiones
function create_divs_selector(layer) {
    $.each(DIVS_NAME, function(key, val) {
        add_divisions_li("selector-divisiones", "dropdownMenuDivisiones",
            val, key, layer)
    })
}

function add_divisions_li(idItems, idButton, text, name, layer) {
    var a = $('<a>').text(text).attr("href", "#").attr("name", name)
    a.click(function() {
        g_divisions["areaLevel"] = this.name

        $("#" + idButton).text(this.text + "   ")
        $("#" + idButton).append($("<span class='caret'></span>"))

        $("#tag-list-divisiones").empty()
        if (this.name != "None") {
            get_filter_divs(layer, g_divisions["areaLevel"])
            $(get_legend("divisions")).css("display", "block")
            g_divisions["displayLgd"] = true
            $("#open-legends").hide("fast")
            $("#close-legends").show("fast")
            recalculate_divisions_indicator(layer, "usdm2_" + current_year,
                function() {
                    do_divisions_map_query(layer)
                    do_points_map_query(layer)
                })

        } else {
            $(get_legend("divisions")).css("display", "none")
            g_divisions["displayLgd"] = false
            set_legend_container_hidden()
        }


        // set_universe_totals(layer)
    })
    $("#" + idItems).append($('<li>').append(a))
}

function update_tooltip(layer, legendType) {
    // sólo usar tooltip o infobox, pero no las dos

    if (legendType == "divisions") {
        // update_divisions_tooltip(layer, legendType)
        // update_divisions_infobox(layer, legendType)
    } else if (legendType == "buffers") {
        // update_buffers_tooltip(layer, legendType)
        // update_buffers_infobox(layer, legendType)
    };
}

function update_divisions_infobox(layer, legendType) {
    // no funciona con divisions+buffers activado
    var division = DIVS_SINGLE_NAME[g_divisions["areaLevel"]]
    var id_field = DIVS_ID_FIELD
    var indicator = g_divisions["indicator"]
    var indicator_desc = INDICS[indicator]["short"]

    $("#divisions-tooltip").remove()

    var sublayer = layer.getSubLayer(SUBLAYER_IDX[legendType])
    sublayer.set({
        'interactivity': ['cartodb_id', id_field, indicator]
    });
    var i = new cdb.geo.ui.InfoBox({
        width: 300,
        layer: layer,
        template: '<div id="divisions-tooltip" class="cartodb-tooltip-content-wrapper"> <div class="cartodb-tooltip-content"><h4>' + division + '</h4><p>{{' + id_field + '}}</p><h4>' + indicator_desc + '</h4><p>{{' + indicator + '}}</p></div></div>',
        position: 'top|left'
    });
    $('#map').append(i.render().el);

}

function update_divisions_tooltip(layer, legendType) {
    var division = DIVS_SINGLE_NAME[g_divisions["areaLevel"]]
    var id_field = DIVS_ID_FIELD
    var indicator = g_divisions["indicator"]
    var indicator_desc = INDICS[indicator]["short"]

    $("#divisions-tooltip").remove()

    var sublayer = layer.getSubLayer(SUBLAYER_IDX[legendType])
    sublayer.set({
        'interactivity': ['cartodb_id', id_field, indicator]
    });
    var i = new cdb.geo.ui.Tooltip({
        layer: layer,
        template: '<div id="divisions-tooltip" class="cartodb-tooltip-content-wrapper"> <div class="cartodb-tooltip-content"><h4>' + division + '</h4><p>{{' + id_field + '}}</p><h4>' + indicator_desc + '</h4><p>{{' + indicator + '}}</p></div></div>',
        width: 200,
        position: 'bottom|right'
    });
    $('#map').append(i.render().el);
    // console.log("Tooltip set with:", division, id_field, indicator)
}

function update_buffers_tooltip(layer, legendType) {
    // no está implementado
}

function set_universe_totals(layer) {
    // remueve resultados anteriores
    replace_universe_with_loading()
    $("#poblacion-total").text("")
    $("#superficie-total").text("")

    var sublayerDivs = layer.getSubLayer(SUBLAYER_IDX["divisions"])
    var sublayerBuffers = layer.getSubLayer(SUBLAYER_IDX["buffers"])
    var queryDivs = sublayerDivs.getSQL()
    var queryBuffers = sublayerBuffers.getSQL()

    if (g_divisions["displayLgd"] && g_buffers["displayLgd"]) {
        set_coverage_universe_totals(queryDivs, queryBuffers)
    } else if (g_divisions["displayLgd"]) {
        set_divisions_universe_totals(queryDivs)
    } else if (g_buffers["displayLgd"]) {
        set_buffers_universe_totals(queryBuffers)
    } else {
        $("#poblacion-total").text("0.00")
        $("#superficie-total").text("0.00")
        replace_loading_with_universe()
    };
}

function set_divisions_universe_totals(mapDivsQuery) {
    var queryPop = mapDivsQuery.replace("divisiones.*", "SUM(hab) AS hab")
    g_pending_actions["divs_pop"] = queryPop
    do_db_query(queryPop, function(data) {
        var pop = format_val("hab", data.rows[0]["hab"])
        if (g_pending_actions["divs_pop"] == queryPop && !g_buffers["displayLgd"]) {
            $("#poblacion-total").text(pop)
            if ($("#superficie-total").text() != "") {
                replace_loading_with_universe()
            };
        };
    })

    var queryArea = mapDivsQuery.replace("divisiones.*", "SUM(area_km2) AS area_km2")
    g_pending_actions["divs_area"] = queryArea
    do_db_query(queryArea, function(data) {
        var area = format_val("area_km2", data.rows[0]["area_km2"])
        if (g_pending_actions["divs_area"] == queryArea && !g_buffers["displayLgd"]) {
            $("#superficie-total").text(area)
            if ($("#poblacion-total").text() != "") {
                replace_loading_with_universe()
            };
        };
    })
}

function set_buffers_universe_totals(mapBuffersQuery) {

    // set population universe total
    var queryPop = query_pop_in(mapBuffersQuery)
    g_pending_actions["buffers_pop"] = queryPop
    do_db_query(queryPop, function(data) {
        var pop = format_val("hab", data.rows[0]["sum"])
        if (g_pending_actions["buffers_pop"] == queryPop) {
            $("#poblacion-total").text(pop)
            if ($("#superficie-total").text() != "") {
                replace_loading_with_universe()
            };
        };
    })

    // set area universe total
    var queryArea = query_area_in(mapBuffersQuery)
    g_pending_actions["buffers_area"] = queryArea
    do_db_query(queryArea, function(data) {
        var area = format_val("area_km2", data.rows[0]["sum"])
        if (g_pending_actions["buffers_area"] == queryArea) {
            $("#superficie-total").text(area)
            if ($("#poblacion-total").text() != "") {
                replace_loading_with_universe()
            };
        };
    })
}

function set_coverage_universe_totals(mapDivsQuery, mapBuffersQuery) {
    var queryPopAll = mapDivsQuery.replace("divisiones.*", "SUM(hab) AS hab")
    var queryAreaAll = mapDivsQuery.replace("divisiones.*", "SUM(area_km2) AS area_km2")
    var queryPopIn = query_pop_in(mapBuffersQuery)
    var queryAreaIn = query_area_in(mapBuffersQuery)

    var allQueries = queryPopAll + queryAreaAll + queryPopIn + queryAreaIn
    g_pending_actions["coverage"] = allQueries

    do_db_query(queryPopAll, function(dataPopAll) {
        var popAll = format_val("hab", dataPopAll.rows[0]["hab"])
        do_db_query(queryAreaAll, function(dataAreaAll) {
            var areaAll = format_val("area_km2", dataAreaAll.rows[0]["area_km2"])

            do_db_query(queryPopIn, function(dataPopIn) {
                var popIn = format_val("hab", dataPopIn.rows[0]["sum"])
                do_db_query(queryAreaIn, function(dataAreaIn) {
                    var areaIn = format_val("area_km2", dataAreaIn.rows[0]["sum"])

                    if (g_pending_actions["coverage"] == allQueries) {
                        var popCover = format_percent(popIn / popAll) + " ("
                        popCover += popIn + " / " + popAll + ")"
                        $("#poblacion-total").text(popCover)

                        var areaCover = format_percent(areaIn / areaAll) + " ("
                        areaCover += areaIn + " / " + areaAll + ")"
                        $("#superficie-total").text(areaCover)

                        replace_loading_with_universe()
                    };
                })
            })
        })
    })

}

// filtros de divisiones
function get_filter_divs(layer, areaLevel) {
    g_divisions["tags"] = []
    var filterMsg = DIVS_FILTER_MSG[areaLevel]

    var filterDivs = []
    $.each(DIVS_FILTER_LEVELS[areaLevel], function(index, filterArea) {
        filterDivs = filterDivs.concat(g_divs_ids[filterArea])
    })

    create_divs_filter(layer, filterDivs, areaLevel, filterMsg)
}

function create_divs_filter(layer, filterDivs, nameDivs, filterMsg) {


    // If using Bootstrap 2, be sure to include:
    // Tags.bootstrapVersion = "2";
    var filter = $('<div>').attr("class", "tag-list")
    $('#tag-list-divisiones').append(filter)
    filter.tags({
        tagData: [],
        suggestions: filterDivs,
        excludeList: [],
        tagSize: "sm",
        caseInsensitive: true,
        restrictTo: filterDivs,
        promptText: filterMsg,
        afterAddingTag: update_queries_with_divs_filter,
        afterDeletingTag: update_queries_with_divs_filter
    });

    function update_queries_with_divs_filter() {
        var tags = this.getTags().slice()
        g_divisions["tags"] = tags.slice()

        setTimeout(function() {
            if (_.isEqual(g_divisions["tags"], tags)) {
                do_divisions_map_query(layer)
                do_points_map_query(layer)
                set_universe_totals(layer)
                calculate_indicators(layer)
                show_or_hide_cols()
            } else {
                console.log("Filter divisions query avoided.")
            };
        }, TIMEOUTS["filter_divs"])
    }
};

function do_divisions_map_query(layer) {
    var sublayer = layer.getSubLayer(SUBLAYER_IDX["divisions"])
    var query = gen_divisions_map_query(g_divisions["areaLevel"],
        g_divisions["tags"])
    g_pending_actions["divs_map"] = query
    do_map_query(sublayer, query)
}

function do_points_map_query(layer) {
    var sublayer = layer.getSubLayer(SUBLAYER_IDX["points"])
    var query = gen_points_map_query(g_divisions["areaLevel"],
        g_divisions["tags"], current_year, g_pending_actions["divs_map"])
    g_pending_actions["points_map"] = query
    do_map_query(sublayer, query)
}

// selector de buffers
function create_buffers_selector(layer) {
    // agrega botones cuyo click cambia el attr name de la lista
    $.each(BUFFERS_TAGS, function(key, val) {
        add_buffers_li("selector-modo-transporte",
            "dropdownMenuBufferModoTrans", key, val)
    })

    $.each(BUFFERS_SIZE, function(key, val) {
        add_buffers_li("selector-buffer-size",
            "dropdownMenuBufferSize", val, val)
    })

    create_selected_buffers_field(layer)

    // boton que agrega el buffer al campo con los seleccionados
    $("#button-add-buffer").click(function() {
        var modo = $("#dropdownMenuBufferModoTrans").text()
        var size = $("#selector-buffer-size").attr("name")
        var tag = modo + " (" + String(size) + ")"
        if (modo.trim() != "Modo transporte" && size != "None") {
            g_buffers["tags"].addTag(tag)
        } else {
            alert("Debe seleccionar un modo de transporte y una distancia.")
        };
    })

}

function add_buffers_li(idItems, idButton, text, name) {
    var a = $('<a>').text(text).attr("href", "#").attr("name", name)
    a.click(function() {
        $("#" + idButton).text(this.text + "   ")
        $("#" + idButton).append($("<span class='caret'></span>"))
        $("#" + idItems).attr("name", this.name)
    })
    $("#" + idItems).append($('<li>').append(a))
}

function create_selected_buffers_field(layer) {
    // If using Bootstrap 2, be sure to include:
    // Tags.bootstrapVersion = "2";
    var selector = $('<div>').attr("class", "tag-list")
    $('#tag-list-buffers').append(selector)
    g_buffers["tags"] = selector.tags({
        readOnly: false,
        tagData: [],
        excludeList: [],
        tagSize: "sm",
        promptText: "No hay buffers seleccionados...",
        beforeAddingTag: remove_repeated_modes,
        afterAddingTag: add_buffer_tag,
        afterDeletingTag: remove_buffer_tag
    })

    function remove_repeated_modes(newTag) {
        var tags = this.getTags()
        if (tags.length >= 1) {
            tags.forEach(function(tag) {
                var modeTag = get_mode_and_size(tag)[0]
                var modeNewTag = get_mode_and_size(newTag)[0]
                if (modeTag == modeNewTag) {
                    g_buffers["tags"].removeTag(tag)
                };
            })
        };
    }

    function add_buffer_tag(newTag) {
        var tags = g_buffers["tags"].getTags().slice()
        if (tags.length == 1) {
            var timeout = 0
        } else {
            var tiemout = TIMEOUTS["add_buffer_tag"]
        };

        setTimeout(function() {
            if (_.isEqual(tags, g_buffers["tags"].getTags().slice())) {
                $("#tag-list-buffers").css("display", "block")
                $("#tag-list-stations-and-lines").css("display", "block")

                update_capas_transporte(newTag, true)
                g_buffers["displayLgd"] = true
                $("#open-legends").hide("fast")
                $("#close-legends").show("fast")
                $("#panel-indicators-seleccionados").css("display", "block")
                calculate_indicators(layer)
                rebuild_table()

                var ms = get_mode_and_size(newTag)
                var modeToAddLines = ms[0]
                get_filter_buffers(layer, modeToAddLines)
            };

        }, timeout)
    }

    function remove_buffer_tag(oldTag) {
        var tags = g_buffers["tags"].getTags().slice()

        setTimeout(function() {
            if (_.isEqual(tags, g_buffers["tags"].getTags().slice())) {
                if (g_buffers["tags"].getTags().length == 0) {
                    g_buffers["displayLgd"] = false
                    g_buffers["filter_tags"] = []
                    $("#tag-list-buffers").css("display", "none")
                    $("#tag-list-stations-and-lines").css("display", "none")

                    if (!g_divisions["displayLgd"]) {
                        $("#panel-indicators-seleccionados").css("display", "none")
                    } else {
                        calculate_indicators(layer)
                        rebuild_table()
                    };
                };
                get_filter_buffers(layer)

                update_capas_transporte(oldTag, false)
            };

        }, TIMEOUTS["remove_buffer_tag"])
    }

    function update_capas_transporte(newTag, check) {
        $("#capas-transporte li").each(function(index) {
            var modeTag = $(this).children("input")[0].name
            var modeNewTag = get_mode_and_size(newTag)[0]
            if (modeTag.split("_")[1] == modeNewTag.split("_")[1]) {
                $(this).children("input").prop("checked", check)
            };
        })
        $("#capas-transporte").trigger("change")
    }



    return g_buffers["tags"]
};

function get_filter_buffers(layer, modeToAddLines) {

    var filterBuffers = []
    $.each(g_buffers["tags"].getTags(), function(index, tag) {
        var origSf = get_sf_name(tag)
        var mode_and_size = get_mode_and_size(tag)

        var stations = jQuery.map(g_buffers_stations[origSf], function(n, i) {
            return "{} ({})".format(n, mode_and_size[0])
        });
        var lines = jQuery.map(g_buffers_lines[origSf], function(n, i) {
            return "{} ({})".format(n, mode_and_size[0].replace("est", "lin"))
        });

        filterBuffers = filterBuffers.concat(stations)
        filterBuffers = filterBuffers.concat(lines)
    })

    if (modeToAddLines) {
        $.each(filterBuffers, function(index, filterBuffer) {
            var nm = get_name_and_mode(filterBuffer)

            var already_filtered = g_buffers["filter_tags"].length > 0
            var is_line = nm[1].split("_")[0] == "lin"
            var add_mode = nm[1].split("_")[1] == modeToAddLines.split("_")[1]
            if (already_filtered && is_line && add_mode) {
                g_buffers["filter_tags"].push(filterBuffer)
            };
        })
    };

    // remove invalid tags
    var new_filter_tags = []
    $.each(g_buffers["filter_tags"], function(index, filterTag) {
        if ($.inArray(filterTag, filterBuffers) != -1) {
            new_filter_tags.push(filterTag)
        };
    })
    g_buffers["filter_tags"] = new_filter_tags

    create_buffers_filter(layer, filterBuffers, BUFFERS_FILTER_MSG)
}

// crear panel de indicators para cambiar las leyendas
function create_panel_indicators_hide_btn() {
    $("#close-indicators-table").click(function() {
        $("#close-indicators-table").hide("fast")
        $("#open-indicators-table").show("fast")
        $(".legend-indic-change-button").show("fast")
        $("#indicators-seleccionados_wrapper").hide("fast")
    })
    $("#open-indicators-table").click(function() {
        $("#open-indicators-table").hide("fast")
        $("#close-indicators-table").show("fast")
        $(".legend-indic-change-button").hide("fast")
        $("#indicators-seleccionados_wrapper").show("fast")
        rebuild_table()
    })
}

function create_change_indicators_panel(layer) {

    var indicsPanel = $("#panel-indicators").children("div .panel-body")
    $("#close-indicators-panel").click(function() {
        $("#panel-indicators").hide("fast")
    })
    $.each(INDICS_HIERARCHY, function(category, indics) {
        var categoryPanel = $("<div>").attr("class", "panel panel-default")

        // la categoría es el título
        var panelTitle = $("<h5>").attr("class", "panel-title")
        var a = $("<a>").text(category).attr("data-toggle", "collapse")
        a.attr("data-parent", "#accordion")
        var idPanelCategory = "category-panel-" + category.split(" ").join("-")
        panelTitle.append(a.attr("href", "#" + idPanelCategory))
        var panelHeading = $("<div>").attr("class", "panel-heading")
        categoryPanel.append(panelHeading.append(panelTitle))

        // los indicators son una lista
        var collapsePanel = $("<div>").attr("id", idPanelCategory)
        collapsePanel.attr("class", "panel-collapse collapse")
        var listIndics = $("<ul>").attr("class", "list-group")
        indics.forEach(function(indic) {
            if (indic in INDICS) {
                listIndics.append(create_indic_changer(layer, indic))
            };
        })
        collapsePanel.append(listIndics)
        categoryPanel.append(collapsePanel)

        indicsPanel.append(categoryPanel)
    })
}

function calculate_indicators(layer) {
    $("#indicators-seleccionados").DataTable().rows().remove().draw()
    var checked = $("#panel-indicators-select").find("input:checked")
    var names = checked.map(function() {
        return this.name;
    }).get();
    select_indicators(layer, names)
}

function create_select_indicators_panel(layer) {
    $("#close-indicators-select").click(function() {
        calculate_indicators(layer)
        $("#panel-indicators-select").hide("fast")
    })

    $("#open-indicators-select").click(function() {
        $("#panel-indicators-select").show("fast")
    })

    var indicsPanel = $("#panel-indicators-select").children("div .panel-body")
    $.each(INDICS_HIERARCHY, function(category, indics) {
        var categoryPanel = $("<div>").attr("class", "panel panel-default")

        // la categoría es el título
        var panelTitle = $("<h5>").attr("class", "panel-title")
        var a = $("<a>").text(category).attr("data-toggle", "collapse")
        a.attr("data-parent", "#accordion-select")
        var idPanelCategory = "category-select-" + category.split(" ").join("-")
        panelTitle.append(a.attr("href", "#" + idPanelCategory))
        var panelHeading = $("<div>").attr("class", "panel-heading")
        categoryPanel.append(panelHeading.append(panelTitle))

        // los indicators son una lista
        var collapsePanel = $("<div>").attr("id", idPanelCategory)
        collapsePanel.attr("class", "panel-collapse collapse")
        var listIndics = $("<ul>").attr("class", "list-group")
        indics.forEach(function(indic) {
            if (indic in INDICS) {
                listIndics.append(create_indic_option(layer, indic))
            };
        })
        collapsePanel.append(listIndics)
        categoryPanel.append(collapsePanel)

        indicsPanel.append(categoryPanel)
    })

    calculate_indicators(layer)
}

function resize_table() {
    var height = calc_data_table_height(0.95)
    set_data_table_height(g_tbl_options, height)
}

function set_data_table_height(options, height) {
    options.sScrollY = height + "px"
    var table = $("#indicators-seleccionados").DataTable(options)
    show_or_hide_cols()
    table.draw()
};

function calc_data_table_height(percent) {
    var percent = percent || 0.95
    var position = $("#indicators-seleccionados").offset()
    var height = ($(document).height() - position.top) * percent
    return (height - 57)
}

function create_selected_indicators_table() {
    var columns = [{
        title: "Indicador"
    }, {
        title: "In"
    }, {
        title: "Out"
    }, {
        title: "All"
    }]
    var options = {
        "columns": columns,
        "bLengthChange": false,
        'bPaginate': false,
        'bInfo': false,
        'bFilter': false,
        'bDestroy': true,
        "sScrollY": "30vh",
        "bScrollCollapse": true
    }
    g_tbl_options = options
    var table = $("#indicators-seleccionados").DataTable(options)
    $(window).resize(function() {
        var height = calc_data_table_height(0.95)
        if (height > 5 && $("#table-spinner").css("display") == "none") {
            rebuild_table()
        } else {
            $("#close-indicators-table").click()
        };
    });
}

function select_indicators(layer, names) {
    var table = $("#indicators-seleccionados").DataTable()
    replace_table_with_loading()

    if (g_divisions["displayLgd"] && g_buffers["displayLgd"]) {
        query_indic_mixed(layer, names, table)
        show_or_hide_cols()

    } else if (g_divisions["displayLgd"] || g_buffers["displayLgd"]) {
        show_or_hide_cols()
        if (g_divisions["displayLgd"]) {
            var sublayer = layer.getSubLayer(SUBLAYER_IDX["divisions"])
            query_divisions_indic_all(layer, names, table, draw_indics_in_table)
        } else {
            query_buffers_indic_in(layer, names, table, draw_indics_in_table)
        };

    } else {
        console.log("Nothing showed in the map.")
    };
}

function replace_table_with_loading() {
    $("#indicators-seleccionados_wrapper").css("display", "none")
    $("#table-spinner").css("display", "block")
}

function replace_loading_with_table() {
    $("#indicators-seleccionados_wrapper").css("display", "block")
    $("#table-spinner").css("display", "none")
    rebuild_table()
}

function replace_universe_with_loading() {
    $("#universe-data p").css("display", "none")
    $("#universe-spinner").css("display", "block")
}

function replace_loading_with_universe() {
    $("#universe-data p").css("display", "block")
    $("#universe-spinner").css("display", "none")
        // rebuild_table()
}

function format_val(indic, value) {
    return Math.round(value * INDICS[indic]["scale"] * 100) / 100
}

function format_percent(value) {
    return Math.round(value * 100 * 100) / 100 + "%"
}

function group_by_weight_type(indics) {
    var groupedIndics = {
        "sum": [],
        "pop": [],
        "area": []
    }
    $.each(indics, function(index, indic) {
        if ($.inArray(indic, NON_WEIGHTED) != -1) {
            groupedIndics["sum"].push(indic)
        } else if ($.inArray(indic, AREA_WEIGHTED) != -1) {
            groupedIndics["area"].push(indic)
        } else {
            groupedIndics["pop"].push(indic)
        };
    })
    return groupedIndics
}

function calc_aggregated_indics(rows, indics) {
    var groupedIndics = group_by_weight_type(indics)
    var averages = {}

    // calc indics that must be added, but not averaged
    if (groupedIndics["sum"].length > 0) {
        $.each(groupedIndics["sum"], function(index, indic) {
            averages[indic] = calc_indic_sum(rows, indic)
        })
    }

    // calc weighted indics
    if (groupedIndics["pop"].length > 0) {
        $.each(groupedIndics["pop"], function(index, indic) {
            averages[indic] = calc_indic_weighted_avg(rows, indic, "hab")
        })
    }
    if (groupedIndics["area"].length > 0) {
        $.each(groupedIndics["area"], function(index, indic) {
            averages[indic] = calc_indic_weighted_avg(rows, indic, "area_km2")
        })
    }

    return averages
}

function calc_indic_sum(rows, indic) {
    var indic_sum = 0
    $.each(rows, function(index, row) {
        indic_sum += row[indic]
    })
    return indic_sum
}

function calc_indic_weighted_avg(rows, indic, weight) {
    var indic_sum = 0
    var weight_sum = 0
    $.each(rows, function(index, row) {
        if (row[indic]) {
            indic_sum += row[indic] * row[weight]
            weight_sum += row[weight]
        }
    })
    return indic_sum / weight_sum
}


function query_buffers_indic_out(layer, indics, table, res_manager) {
    var mapDivisionsQuery = layer.getSubLayer(SUBLAYER_IDX["divisions"]).getSQL()
    var mapBuffersQuery = layer.getSubLayer(SUBLAYER_IDX["buffers"]).getSQL()
    var query = gen_buffers_out_query(mapDivisionsQuery, mapBuffersQuery, indics)

    g_pending_actions["buffers_out"] = query
    do_db_query(query, function(data) {
        var averages = calc_aggregated_indics(data.rows, indics)
        if (g_pending_actions["buffers_out"] == query) {
            res_manager(layer, table, indics, averages)
        } else {
            res_manager(layer, table, indics, null)
        };
    })
}

function query_buffers_indic_in(layer, indics, table, res_manager) {
    var sublayer = layer.getSubLayer(SUBLAYER_IDX["buffers"])
    var query = gen_buffers_in_query(sublayer.getSQL(), indics)

    g_pending_actions["buffers_in"] = query
    do_db_query(query, function(data) {
        var averages = calc_aggregated_indics(data.rows, indics)
        if (g_pending_actions["buffers_in"] == query) {
            res_manager(layer, table, indics, averages)
        } else {
            res_manager(layer, table, indics, null)
        };
    })
}

function query_divisions_indic_all(layer, indics, table, res_manager) {
    var sublayer = layer.getSubLayer(SUBLAYER_IDX["divisions"])
    var groupedIndics = group_by_weight_type(indics)
    var result = {}

    // create count variables query
    var countCols = ""
    if (groupedIndics["sum"].length > 0) {
        $.each(groupedIndics["sum"], function(index, indic) {
            countCols += ", SUM(" + indic + ") AS " + indic
        })
        countCols = countCols.slice(1)
        var countQuery = sublayer.getSQL().replace("divisiones.*", countCols)
    } else {
        countQuery = ""
    };

    // create weighted variables query
    var weightedIndics = $.merge(groupedIndics["area"], groupedIndics["pop"])
    weightedIndics.push("area_km2")
    weightedIndics.push("hab")

    if (weightedIndics.length > 2) {
        var weightedCols = weightedIndics.join(", ")
        var weightedQuery = sublayer.getSQL().replace("divisiones.*", weightedCols)
    } else {
        var weightedCols = ""
        var weightedQuery = ""
    };

    g_pending_actions["divs_all"] = countQuery + weightedQuery
        // count query first
    do_db_query(countQuery, function(dataCountQuery) {
        // then weighted query
        do_db_query(weightedQuery, function(dataWeightedQuery) {
            var sumAreaWeight = 0
            var sumPopWeight = 0
            var sumWeightedIndics = {}
            $.each(weightedIndics, function(index, indic) {
                if (indic != "hab" && indic != "area_km2") {
                    sumWeightedIndics[indic] = 0
                }
            })

            $.each(dataWeightedQuery.rows, function(index, row) {
                sumAreaWeight += row["area_km2"]
                sumPopWeight += row["hab"]

                $.each(sumWeightedIndics, function(key, value) {
                    if ($.inArray(key, AREA_WEIGHTED) != -1) {
                        sumWeightedIndics[key] += row[key] * row["area_km2"]
                    } else {
                        sumWeightedIndics[key] += row[key] * row["hab"]
                    };
                })
            })

            var result = {}
            $.each(sumWeightedIndics, function(key, value) {
                if ($.inArray(key, AREA_WEIGHTED) != -1) {
                    result[key] = value / sumAreaWeight
                } else {
                    result[key] = value / sumPopWeight
                };
            })

            result = $.extend(dataCountQuery.rows[0], result)

            if (g_pending_actions["divs_all"] == countQuery + weightedQuery) {
                res_manager(layer, table, indics, result)
            } else {
                res_manager(layer, table, indics, null)
            };
        })
    })
}

function create_indic_changer(layer, indic) {
    var li = $("<li>").attr("class", "list-group-item")
    var a = $("<a>").text(INDICS[indic]["short"]).click(function() {
        var legendType = $("#panel-indicators").attr("legend-type")
        if (legendType == "divisions") {
            set_table_indic_color(indic, "divisions")
            recalculate_divisions_indicator(layer, indic)
        } else {
            set_table_indic_color(indic, "buffers")
            recalculate_buffers_indicator(layer, indic)
        };
    })
    a.attr("data-hover", "tooltip").attr("data-placement", "right")
    a.attr("title", INDICS[indic]["long"])
    return li.append(a)
}

function create_indic_option(layer, indic) {
    var li = $('<li>').attr("class", "list-group-item")
    li.append($("<input type='checkbox'>").attr("name", indic))
    var span = $("<span>").text("   " + INDICS[indic]["short"])
    span.attr("data-hover", "tooltip").attr("data-placement", "right")
    span.attr("title", INDICS[indic]["long"])
    li.append(span)

    if ($.inArray(indic, DEFAULT_SELECTED_INDICATORS) != -1) {
        $(li.find("input")[0]).prop("checked", true)
    };
    return li
}

function recalculate_divisions_indicator(layer, indic, callback) {
    var legendType = "divisions"
    var divsMapQuery = layer.getSubLayer(SUBLAYER_IDX[legendType]).getSQL()
    var query = gen_divs_legend_query(indic, divsMapQuery)
    recalculate_indicator(layer, indic, query, legendType, callback)
}

function recalculate_indicator(layer, indic, query, legendType, callback) {
    $("#divisions-spinner").show("fast")
    g_pending_actions[legendType + "_legend"] = query
    do_db_query(query, function(data) {
        var all = data.rows
            // debugger

        // remove nulls
        // console.log(all)
        var pos = all.length - 1
            // console.log(pos, all.length, all[pos][indic], all[all.length])
        while (!all[pos][indic]) {
            pos -= 1
                // console.log(pos)
        }
        // console.log(all.length - 1, pos)
        all = all.slice(0, pos + 1)
            // console.log(all.length - 1, pos)
            // console.log(pos, all.length - 1, all[pos][indic])

        var min = all[0][indic]
        var max = all[all.length - 1][indic]
            // debugger

        if (g_pending_actions[legendType + "_legend"] == query) {
            create_legend(indic, legendType, min, max)
            change_indic(indic, legendType, min, max, all, layer)
            $("#panel-indicators").css("display", "none")
            if (callback) {
                callback()
            };
            $("#divisions-spinner").hide("fast")
        }
    })
}


// create custom Legend
function get_legend(legendType) {
    var idx = LEGEND_IDX[legendType]
    return $("div .cartodb-legend-stack").children("div")[idx]
}


function create_legends_hide_btn() {
    $("#close-legends").click(function() {
        $(".cartodb-legend-stack").hide("fast")
        $("#close-legends").hide("fast")
        $("#open-legends").show("fast")
    })
    $("#open-legends").click(function() {
        $(".cartodb-legend-stack").show("fast")
        $("#open-legends").hide("fast")
        $("#close-legends").show("fast")
    })
}

function create_legend(indic, legendType, min, max) {
    var legend = get_legend(legendType)
    $(legend).attr("id", "legend-" + legendType)

    var colors = $(legend).find(".colors")[0]
    $(colors).empty()
    $.each(COLORS[legendType], function(index, color) {
        $(colors).prepend(get_lgd_color_div(color))
    })

    g_divisions["indicator"] = indic

    $("#current-" + legendType + "-indic").remove()
    $(legend).prepend(build_legend_indicator(indic, legendType))

    // set min-max
    var liMin = $(legend).find("li.min")[0]
    $(liMin).text(Math.round(min * INDICS["usdm2"]["scale"] * 100) / 100)
    var liMax = $(legend).find("li.max")[0]
    $(liMax).text(Math.round(max * INDICS["usdm2"]["scale"] * 100) / 100)

    if (g_divisions["displayLgd"]) {
        $(legend).css("display", "block")
        $("#map .cartodb-legend-stack").show("fast")
        $("#show-hide-legends").show("fast")
    } else {
        $(legend).css("display", "none")
        set_legend_container_hidden()
    };

    show_hide_legend_indic_change_btn()
}

function get_lgd_color_div(color) {
    return $('<div class="quartile" style="background-color:' + color + '"></div>')
}

function show_hide_legend_indic_change_btn() {
    if ($("#close-indicators-table").css("display") == "none") {
        $(".legend-indic-change-button").show("fast")
    } else {
        $(".legend-indic-change-button").hide("fast")
    };
}

function set_legend_container_hidden() {
    if (!g_divisions["displayLgd"]) {
        $("#map .cartodb-legend-stack").hide("fast")
        $("#show-hide-legends").hide("fast")
    };
}

function build_legend_indicator(indic, legendType) {
    var change = $("<a>").text("cambiar").click(function() {
        $("#panel-indicators").css("display", "block")
        $("#panel-indicators").attr("legend-type", legendType)
    })
    change.attr("class", "legend-indic-change-button")
    var text = LEGEND_NAME[legendType] + ": " + INDICS["usdm2"]["short"] + "  "
    var p = $("<p>").attr("id", "current-" + legendType + "-indic")
    return p.append(text).append(change).attr("class", "legend-indic")
}

function change_indic(indic, legendType, min, max, all, layer) {
    g_divisions["indicator"] = indic

    if (all.length > COLORS[legendType].length) {
        var step = Math.round(all.length / (COLORS[legendType].length))
        var positions = _.range(all.length, 0, -step)
        while (positions.length < COLORS[legendType].length) {
            positions.push(positions[positions.length - 1])
        }
    } else {
        var positions = _.range(all.length, 0, -1)
    };
    var thresholds = $.map(positions, function(pos, index) {
        return all[pos - 1][indic]
    })

    // error tolerance
    thresholds[0] = thresholds[0] * 1.0000001
    var css = create_css(indic, COLORS[legendType], thresholds,
        TBL_NAMES[legendType], DEFAULT_COLORS[legendType])

    var sublayer = layer.getSubLayer(SUBLAYER_IDX[legendType])
    sublayer.setCartoCSS(css)
        // update_tooltip(layer, legendType)
}

function get_tooltip(legendType) {
    return $('#tooltip_' + legendType)
}

function get_tooltip_html(legendType) {
    var ini_script = '<script type="tooltip/html" id="tooltip_divisions">'
    var end_script = '</script>'
    return ini_script + get_tooltip(legendType).html() + end_script
}

// create custom css
function create_css(indic, colors, thresholds, table, defaultColour) {
    table = "#" + table

    // general settings
    var css = "/** choropleth visualization */ "
    css += table + "{polygon-fill: " + defaultColour + ";"
    css += "polygon-opacity: 0.7; line-color: #FFF; line-width: 0.25;"
    css += "line-opacity: 0.8;} "

    // colors segments
    $.each(thresholds, function(index, threshold) {
        if (index < colors.length) {
            css += table + "[" + indic + "<=" + threshold + "]{"
            css += "polygon-fill:" + colors[index] + "} "
        }
    })
    return css
}

// descargar mapa
function create_download_image(layers) {
    $("#button-download-image").click(function() {
        var height = $("#image-height").val()
        var width = $("#image-width").val()
        display_image_new_window(layers, height, width)
    })
}

function display_image_new_window(layers, height, width) {
    var sublayers = [{
        type: "http",
        options: {
            urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            subdomains: ["a", "b", "c"],
        },
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }]
    for (var i in [0, 1, 2, 3]) {
        if (layers[1].getSubLayer(i).isVisible()) {
            sublayers.push({
                type: "cartodb",
                options: {
                    sql: layers[1].getSubLayer(i).getSQL(),
                    cartocss: layers[1].getSubLayer(i).getCartoCSS(),
                    cartocss_version: "2.1.1"
                }
            })
        }
    }

    var layer_definition = {
        user_name: USER,
        tiler_domain: "cartodb.com",
        tiler_port: "80",
        tiler_protocol: "http",
        layers: sublayers
    };

    var sql = new cartodb.SQL({
        user: USER
    });

    sql.getBounds("SELECT * FROM divisiones")
        .done(function(bounds) {
            var bbox = [bounds[1][1], bounds[1][0], bounds[0][1],
                bounds[0][0]
            ]
            var img = cartodb.Image(layer_definition)
                .size(height, width)
                .bbox(BBOX)
                // .into($(w.document.body).find("img")[0])
                .getUrl(function(err, url) {
                    console.log(url)
                    var w = window.open(url)
                })
        })
}

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var bb = new BlobBuilder();
    bb.append(ab);
    return bb.getBlob(mimeString);
}
