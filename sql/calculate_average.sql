WITH average AS
    (SELECT comuna, sum(deptos_con_divs.dolares) / sum(deptos_con_divs.m2) AS usd_m2
     FROM deptos_con_divs WHERE orig_sf = '2014'
     GROUP BY comuna)

SELECT divisiones.the_geom,
       divisiones.id_div,
       average.usd_m2
FROM divisiones,
     average
WHERE divisiones.orig_sf = 'DPTO' AND divisiones.id_div = average.comuna

