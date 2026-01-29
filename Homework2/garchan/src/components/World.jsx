import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from "d3";
import { filter, isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import WorldMap from '../../data/countries-50m.json'
import countryCodes from '../../data/countryCodes.json';
import { feature, mesh } from "topojson-client";
import CountryList from './CountryList.jsx'
import CountryTag from './CountryTag.jsx';

const COUNTRY_BOUNDARY_WIDTH = 1;
const MAX_ZOOM = 50;
const margin = {left: 50, bottom: 50};

export default function World(props){
    const [filteredMedals, setFilteredMedals] = useState([]);           // details with no counts
    const [filteredMedalCounts, setFilteredMedalCounts] = useState({}); // {country: count}
    const worldContainerRef = useRef(null);
    const worldRef = useRef(null);

    const [size, setSize] = useState({ width: 0, height: 0 });

    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: worldRef, onResize });

    const colorScale = d3.scalePow()
        .domain([0, 1, 126])
        .range(['#ccc', '#fd5', '#640'])

    // Render when window size changes
    useEffect(() => {
        if (isEmpty(WorldMap)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#world-svg').selectAll('*').remove();       
        drawChart(worldRef.current, worldContainerRef.current, colorScale, size);
        recolorChart(filteredMedalCounts, colorScale, props.selectedCountries);
    }, [size]);

    // Recolor when data is updated
    useEffect(() => {
        let tempObj = {};
        for(let i = 0; i < props.selectedCountries.length; i++){
            const longName = countryCodes[props.selectedCountries[i].country];
            tempObj[longName] = 0;
        }
        for(let i = 0; i < filteredMedals.length; i++){
            const entry = filteredMedals[i];            
            tempObj[entry.country]++;
        }
        setFilteredMedalCounts(tempObj);
        recolorChart(tempObj, colorScale, props.selectedCountries);
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
            const medalIsSelected = Boolean(props.selectedMedals[entry.medal])
			return dateIsSelected && countryIsSelected && medalIsSelected;
		}));
	}, [props.medalCsv, props.selectedCountries, props.selectedDates, props.selectedMedals])

    return (
        <Paper elevation={3} sx={{height: '100%', boxSizing: 'border-box', padding: '10px'}}>
            <Stack id='world-panel' spacing={1} sx={{height: '100%'}}>
                <Paper sx={{marginTop: '10px'}}>
                    <Stack id='world-widgets' direction={'row'} spacing={1} alignItems={'center'} sx={{ margin: '5px'}}>
                        <CountryList />
                        <Button variant='outlined' onClick={() => props.addCountry(fetchListValue())}>Add</Button>
                        {props.selectedCountries.map((entry, idx) => {
                            const tagProps = {
                                country: entry.country,
                                color: entry.color,
                                index: idx,
                                removeCountry: props.removeCountry
                            }
                            return <CountryTag key={idx} {...tagProps} />
                        })}
                    </Stack>
                </Paper>
                <Paper sx={{flex: 1}}>
                    <Box id='world-content' ref={worldContainerRef} sx={{width: '100%', height: '100%'}}>
                        <svg id='world-svg' ref={worldRef} width='100%' height='100%'></svg>
                    </Box>
                </Paper>
            </Stack>
        </Paper>
    )
}

function drawChart(svgElement, containerElement, colorScale, size){
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();    // clear previous render
    const centerX = size.width / 2;
    const centerY = size.height / 2;

    // Create tooltip element
    const tooltip = d3.select(containerElement).append('div')
        .attr('class', 'tooltip');

    // Set up projection
    const proj = d3.geoNaturalEarth1()
        .scale(0.3 * Math.min(size.width, size.height))
        .center([0, 0])
        .translate([centerX, centerY]);

    const mapPath = d3.geoPath().projection(proj);

    const g = svg.append('g')
        .attr('id', 'draw-group');

    // Draw countries
    const countries = g.append('g')
        .selectAll('path')
        .data(feature(WorldMap, WorldMap.objects.countries).features)
        .join('path')
        .attr('id', (d) => `country-geo-${d.properties.name}`)
        .attr('class', 'country-geo')
        .attr('stroke', 'white')
        .attr('stroke-width', COUNTRY_BOUNDARY_WIDTH)
        .attr('d', mapPath)
        .on('mouseover', (event, d) => showToolTip(event, d, tooltip))
        .on('mousemove', (event, d) => moveToolTip(event, tooltip))
        .on('mouseout', (event, d) => hideToolTip(event, tooltip));

    // Draw legend
    const legendScale = d3.scaleLinear()
        .domain([1, 126])
        .range([size.height - 1, size.height - 126])
    
    svg.append('g')
        .attr('transform', `translate(20, ${(size.height - margin.bottom + 25)}) rotate(-90)`)
        .append('text')
        .text('Medals Over Selected Days')
        .style('font-size', '0.8rem');

    svg.append('g')
        .attr('transform', `translate(${margin.left + 6}, ${-margin.bottom})`)
        .call(d3.axisLeft(legendScale).tickValues([20, 40, 60, 80, 100, 120]))
    
    svg.append('g')
        .attr('transform', `translate(${margin.left - 8}, ${(size.height - margin.bottom + 13)})`)
        .append('text')
        .text('0')
        .style('font-size', '0.65rem');

    svg.append('g')     // gradient
        .selectAll('rect')
        .data(Array.from({length: 126}, (_, idx) => 1 + idx))
        .join('rect')
        .attr('x', margin.left + 5)
        .attr('y', d => size.height - margin.bottom - d)
        .attr('width', 20)
        .attr('height', 1)
        .attr('fill', d => colorScale(d))

    svg.append('g')     // gray for 0
        .append('rect')
        .attr('x', margin.left + 5)
        .attr('y', size.height - margin.bottom)
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', '#ccc')

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

function recolorChart(filteredMedalCounts, colorScale, selectedCountries){
    d3.select('#draw-group')
        .selectAll('path')
        .data(feature(WorldMap, WorldMap.objects.countries).features)
        // Highlight selected countries
        .attr('fill', function(d){
            if(d.properties.name in filteredMedalCounts){
                return colorScale(filteredMedalCounts[d.properties.name]);
            } else {
                return '#eee';
            }
        })
        // Color code countries with stroke color (I can't get the draw order to work)
        // .attr('stroke', function(d){
        //     if(d.properties.name in filteredMedalCounts){
        //         for(let i = 0; i < selectedCountries.length; i++){
        //             if(d.properties.name === countryCodes[selectedCountries[i].country]){
        //                 return selectedCountries[i].color;
        //             }
        //         }
        //     }
        //     return 'white';
        // })
}

function fetchListValue(){
    return d3.select('#country-select').property('value');
}

function showToolTip(event, d, tooltip){
    tooltip.selectAll('*').remove();
    tooltip.append('p')
        .text(d.properties.name)
        .style('font-size', '0.8rem');
    tooltip
        .style('left', `${event.pageX - tooltip.node().getBoundingClientRect().width / 2}px`)
        .style('top', `${event.pageY + 20}px`);
    tooltip.transition()
        .duration(150)
        .style('opacity', 1);
}

function moveToolTip(event, tooltip){
    tooltip
        .style('left', `${event.pageX - tooltip.node().getBoundingClientRect().width / 2}px`)
        .style('top', `${event.pageY + 20}px`);
}

function hideToolTip(event, tooltip){
    tooltip.transition()
        .duration(150)
        .style('opacity', 0);
}