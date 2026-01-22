import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from "d3";
import { filter, isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import WorldMap from '../../data/countries-110m.json'
import countryCodes from '../../data/countryCodes.json';
import { feature, mesh } from "topojson-client";

const COUNTRY_BOUNDARY_WIDTH = 1;
const MAX_ZOOM = 10;

export default function World(props){
    const [filteredMedals, setFilteredMedals] = useState([]);           // details with no counts
    const [filteredMedalCounts, setFilteredMedalCounts] = useState({}); // {country: count}
    const worldRef = useRef(null);

    const [size, setSize] = useState({ width: 0, height: 0 });

    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: worldRef, onResize });

    // Render when window size changes
    useEffect(() => {
        if (isEmpty(WorldMap)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#world-svg').selectAll('*').remove();

        
        drawChart(worldRef.current, size, filteredMedalCounts, props);
        recolorChart(filteredMedalCounts, props);
    }, [size]);

    // Recolor when data is updated
    useEffect(() => {
        if (isEmpty(filteredMedals)) return;
        let tempObj = {};
        for(let i = 0; i < filteredMedals.length; i++){
            const entry = filteredMedals[i];
            
            if(tempObj[entry.country]){
                tempObj[entry.country]++;
            } else {
                tempObj[entry.country] = 1;
            }
        }
        setFilteredMedalCounts(tempObj);
        recolorChart(filteredMedalCounts, props);
    }, [filteredMedals]);

    // Compile the data from which to render
    useEffect(() => {
		if(props.medalCsv == null) return;
		if(props.selectedCountries == null) return;
		if(props.selectedDates == null) return;
		setFilteredMedals(props.medalCsv.filter((entry) => {
			const dateIsSelected = props.selectedDates.includes(entry.date);
			let countryIsSelected = false;
			for(let i = 0; i < props.selectedCountries.length; i++){
				if (props.selectedCountries[i].country === entry.countryCode){
					countryIsSelected = true;
					break;
				}
			}
			return dateIsSelected && countryIsSelected;
		}));
		console.log(filteredMedals);
	}, [props.medalCsv, props.selectedCountries, props.selectedDates])

    return (
        <Paper elevation={3} sx={{height: '100%', boxSizing: 'border-box', padding: '10px'}}>
            <Stack id='world-panel' spacing={1} sx={{height: '100%'}}>
                <Paper sx={{marginTop: '10px'}}>
                    <Stack id='world-widgets' direction={'row'} sx={{ margin: '5px'}}>
                        <Button>Widget 1</Button>
                        <Button>Widget 2</Button>
                    </Stack>
                </Paper>
                <Paper sx={{flex: 1}}>
                    <Box id='world-content' sx={{width: '100%', height: '100%'}}>
                        <svg id='world-svg' ref={worldRef} width='100%' height='100%'></svg>
                    </Box>
                </Paper>
            </Stack>
        </Paper>
    )
}

function drawChart(svgElement, size, filteredMedalCounts, props){
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();    // clear previous render
    const centerX = size.width / 2;
    const centerY = size.height / 2;

    const proj = d3.geoNaturalEarth1()
        .scale(0.3 * Math.min(size.width, size.height))
        .center([0, 0])
        .translate([centerX, centerY]);

    const mapPath = d3.geoPath().projection(proj);

    const g = svg.append('g')
        .attr('id', 'draw-group');

    const countries = g.append('g')
        .selectAll('path')
        .data(feature(WorldMap, WorldMap.objects.countries).features)
        .join('path')
        .attr('id', (d) => `country-geo-${d.properties.name}`)
        .attr('class', 'country-geo')
        .attr('stroke', 'white')
        .attr('stroke-width', COUNTRY_BOUNDARY_WIDTH)
        .attr('d', mapPath)

    // Zoom logic
    function zoomManual(e){
        g.attr('transform', e.transform);
        countries.attr('stroke-width', COUNTRY_BOUNDARY_WIDTH / e.transform.k);
    }
    const zoom = d3.zoom()
        .scaleExtent([1, MAX_ZOOM])
        .on('zoom', zoomManual)

    svg.call(zoom);

    return svg.node()
}

function recolorChart(filteredMedalCounts, props){
    const legendColorScale = d3.scaleLinear()
        .domain([0, 16])
        .range(['#fd0', '#640'])

    const colorScale = d3.scalePow()
        .domain([0, 1, Math.max(...Object.values(filteredMedalCounts))])
        .range(['#ddd', '#fd5', legendColorScale(props.selectedDates.length)])

    d3.select('#draw-group')
        .selectAll('path')
        .data(feature(WorldMap, WorldMap.objects.countries).features)
        .attr('fill', function(d){
            if(filteredMedalCounts[d.properties.name]){
                return colorScale(filteredMedalCounts[d.properties.name]);
            } else {
                return '#eee';
            }
        })
}