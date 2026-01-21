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

function Layout() {
	const [medalTally, setMedalTally] = useState([]);
	const [selectedCountries, setSelectedCountries] = useState([]);
	const top5 = [
			{country: 'USA', color: 'dodgerblue'},
			{country: 'CHN', color: 'crimson'},
			{country: 'JPN', color: 'lightseagreen'},
			{country: 'AUS', color: 'orange'},
			{country: 'FRA', color: 'mediumorchid'}
	];
	
	const [colorPalette, setColorPalette] = useState([]);

	// Variables and methods to pass to 
	const timelineProps = {
		medalTally: medalTally,
		setMedalTally: setMedalTally,
		selectedCountries: selectedCountries,
		setSelectedCountries: setSelectedCountries
	}

    return (
        <Box id="main-container" sx={{ maxWidth: "95%", mx: "auto", minHeight: 0 }}>
            <Stack spacing={3} sx={{ height: "95%", minHeight: 0 }}>
                <Box id="title" sx={{ height: "7%" }}>
                    <h1>Paris Olympics 2024</h1>
                </Box>
                <Grid container spacing={3} sx={{ height: "100%", minHeight: 0 }}>
                    <Grid size={6} sx={{ minHeight: 0 }}>
                        <Bubble />
                    </Grid>
                    <Grid size={6} sx={{ minHeight: 0 }}>
                        <Stack gap={3} sx={{ height: "calc(100% - 20px)", minHeight: 0, maxHeight: "100%"}}>
                            <Box sx={{ height: "70%", minHeight: 0 }}>
                                <World />
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

export default App;
