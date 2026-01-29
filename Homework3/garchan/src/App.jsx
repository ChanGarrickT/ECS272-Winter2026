import Bubble from "./components/Bubble.jsx";
import World from "./components/World.jsx";
import Timeline from "./components/Timeline.jsx";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import * as d3 from 'd3';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { grey } from "@mui/material/colors";
import { useState, useEffect, useRef } from 'react';
import getEmptyRow from './components/countryMedalCount';

// Adjust the color theme for material ui
const theme = createTheme({
    palette: {
        primary: {
            main: grey[700],
        },
        secondary: {
            main: grey[700],
        },
    },
});

// Static state for debugging
const defaultCountries = [
	{country: 'USA', color: 'dodgerblue'},
	{country: 'CHN', color: 'crimson'},
	{country: 'JPN', color: 'mediumseagreen'},
	{country: 'AUS', color: 'mediumorchid'},
	{country: 'FRA', color: 'darkorange'}
];

const defaultHighlightDates = [
	'2024-08-11',
	'2024-08-10'
]

const defaultDates = [
	'2024-08-11'
]

function Layout() {
	const [medalCsv, setMedalCsv] = useState(null);
	const [medalTally, setMedalTally] = useState([]);
	const [selectedCountries, setSelectedCountries] = useState(defaultCountries);
	const [highlightedDates, setHighlightedDates] = useState([]);
	const [selectedDates, setSelectedDates] = useState(defaultDates);
	const [selectedMedals, setSelectedMedals] = useState({gold: 1, silver: 1, bronze: 1})

	const [colorPalette, setColorPalette] = useState(['mediumblue']);

	useEffect(() => {
		// Read CSV once HTML element is loaded
		const dataFromCSV = async () => {
			const codeToMedal = ['0', 'gold', 'silver', 'bronze'];
			try {
				const csvData = await d3.csv('../../data/medals.csv', d => {
					// This callback allows you to rename the keys, format values, and drop columns you don't need
					return {date: d.medal_date, medal: codeToMedal[parseInt(d.medal_code)], countryCode: d.country_code, country: d.country, discipline: d.discipline, event: d.event};
				});
				setMedalCsv(csvData);
				setMedalTally(tally(csvData));
			} catch (error) {
				console.error('Error loading CSV:', error);
			}
		} 
			dataFromCSV();
		}, []);

	// Add and remove a countries from inspection list
	// This implementation allows countries to maintain consistent colors when selection changes
	function addCountry(code){
		if(selectedCountries.length >= 6){
			alert('Maximum 6 countries allowed');
			return;
		}
		// Prevent duplicate selection
		for(let i = 0; i < selectedCountries.length; i++){
			if(selectedCountries[i].country === code) return;
		}

		const color = colorPalette.at(-1)
		setSelectedCountries(prev => [...prev, {country: code, color: color}])
		// Remove color from palette
		setColorPalette(prev => {
			let temp = [...prev]
			temp.pop()
			return temp
		})
	}

	function removeCountry(idx, color){
		setSelectedCountries(prev => {
			let temp = [...prev]
			temp.splice(idx, 1)
			return temp
		});
		// Restore color to palette
		setColorPalette(prev => [color, ...prev])
	}

	// Variables and methods to pass to children
	const bubbleProps = {
		setHighlightedDates: setHighlightedDates,
		selectedDates: selectedDates
	}

	const worldProps = {
		medalCsv: medalCsv,
		selectedCountries: selectedCountries,
		selectedDates: selectedDates,
		selectedMedals: selectedMedals,
		addCountry: addCountry,
		removeCountry: removeCountry
	}

	const timelineProps = {
		medalTally: medalTally,
		setMedalTally: setMedalTally,
		selectedCountries: selectedCountries,
		setSelectedCountries: setSelectedCountries,
		highlightedDates: highlightedDates,
		selectedDates: selectedDates,
		setSelectedDates: setSelectedDates,
		selectedMedals: selectedMedals,
		setSelectedMedals: setSelectedMedals
	}

    return (
        <Box id="main-container" sx={{ maxWidth: "95%", mx: "auto", minHeight: 0 }}>
            <Stack spacing={3} sx={{ height: "95%", minHeight: 0 }}>
                <Box id="title" sx={{ height: "7%" }}>
                    <h1>Paris Olympics 2024</h1>
                </Box>
                <Grid container spacing={3} sx={{ height: "100%", minHeight: 0 }}>
                    <Grid size={6} sx={{ minHeight: 0 }}>
                        <Bubble {...bubbleProps}/>
                    </Grid>
                    <Grid size={6} sx={{ minHeight: 0 }}>
                        <Stack gap={3} sx={{ height: "calc(100% - 20px)", minHeight: 0, maxHeight: "100%"}}>
                            <Box sx={{ height: "70%", minHeight: 0 }}>
                                <World {...worldProps}/>
                            </Box>
                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                <Timeline {...timelineProps}/>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Stack>
        </Box>
    );
}

function App() {

    return (
        <ThemeProvider theme={theme}>
            <Layout />
        </ThemeProvider>
    );
}

function tally(data){
    let currentDate = '2024-07-26';
    let currentTally = getEmptyRow();
    let results = []
    data.forEach(d => {
        if(currentDate !== d.date){
            results.push(JSON.parse(JSON.stringify({date: currentDate, ...currentTally})));
            currentDate = d.date;
        }
        currentTally[d.countryCode][d.medal]++;
    })
    results.push(JSON.parse(JSON.stringify({date: currentDate, ...currentTally})));
    return results;
}

export default App;
