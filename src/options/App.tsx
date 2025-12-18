/// <reference types="chrome"/>

import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  CssBaseline,
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  Fade,
} from '@mui/material';

interface Settings {
  toggleButtons: boolean;
  wordWrap: boolean;
}

// Material Design 3 Dark Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#03dac6',
      dark: '#018786',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    toggleButtons: true,
    wordWrap: true,
  });
  const [showStatus, setShowStatus] = useState<boolean>(false);

  useEffect(() => {
    // Load settings from storage
    chrome.storage.sync.get(
      { toggleButtons: true, wordWrap: true },
      (items: Record<string, boolean>) => {
        setSettings({
          toggleButtons: items.toggleButtons ?? true,
          wordWrap: items.wordWrap ?? true,
        });
      }
    );
  }, []);

  const saveSettings = (newSettings: Settings) => {
    let updatedSettings = { ...newSettings };

    // If toggle buttons are disabled, also disable word wrap
    if (!newSettings.toggleButtons) {
      updatedSettings.wordWrap = false;
    }

    chrome.storage.sync.set(updatedSettings, () => {
      setShowStatus(true);
      setTimeout(() => {
        setShowStatus(false);
      }, 3000);
    });

    setSettings(updatedSettings);
  };

  const handleToggleButtonsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    saveSettings({ ...settings, toggleButtons: event.target.checked });
  };

  const handleWordWrapChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    saveSettings({ ...settings, wordWrap: event.target.checked });
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container sx={{ py: 2, minWidth: 300 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          Git Diff Flex: Settings
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Toggle Buttons
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.toggleButtons}
                    onChange={handleToggleButtonsChange}
                    color="primary"
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Toggle buttons are located in the file's header and are used to
              quickly switch between viewing the deletions, additions, or both
              (split).
            </Typography>
          </Paper>

          <Paper elevation={1} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Word Wrap
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.wordWrap}
                    onChange={handleWordWrapChange}
                    disabled={!settings.toggleButtons}
                    color="primary"
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              By default, the code blocks in both file versions will wrap to the
              next line. This setting is available when "Toggle Buttons" is
              enabled and toggled "on".
            </Typography>
          </Paper>
        </Box>

        <Fade in={showStatus}>
          <Alert severity="success" sx={{ mt: 3 }}>
            Settings updated!
          </Alert>
        </Fade>
      </Container>
    </ThemeProvider>
  );
};

export default App;
