import {createTheme} from '@mui/material/styles';
import {deDE} from '@mui/material/locale';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#AC162B',
    },
    secondary: {
      main: '#303647',
    },
    error: {
      main: '#FF1A00',
    },
    warning: {
      main: '#fbbd14',
    },
    success: {
      main: '#8ac149',
    },
    info: {
      main: '#62c2d0',
    },
  },
}, deDE);
