import Bubble from './components/Bubble.jsx'
import Chord from './components/Chord.jsx'
import Timeline from './components/Timeline.jsx'
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    primary:{
      main: grey[700],
    },
    secondary:{
      main: grey[700],
    }
  },
})

// For how Grid works, refer to https://mui.com/material-ui/react-grid/

function Layout() {
  return (
    <Box id='main-container' sx={{ maxWidth: '80%', mx: 'auto'}}>
      <Stack spacing={3} sx={{ height: '100%' }}>
        <Box id='title' sx={{ height: '7%' }}>
          <h1>Paris Olympics 2024</h1>
        </Box>
        <Grid container spacing={3} sx={{ height: '55%' }}>
          <Grid size={6}>
            <Bubble />
          </Grid>
          <Grid size={6}>
            <Chord />
          </Grid>
        </Grid>
        <Box id='timeline' sx={{ height: '25%' }}>
          <Timeline />
        </Box>
      </Stack>
    </Box>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  )
}

export default App
