import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    RadioGroup,
    Radio,
    FormControlLabel,
    FormControl,
    FormLabel,
    Select,
    MenuItem,
    InputLabel,
    Checkbox,
    Button,
    Grid,
    Autocomplete,
    Alert,
    Skeleton,
    FormHelperText,
    Fade,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider
} from '@mui/material';
import { DirectionsCar, Send, Cancel, AccessTime } from '@mui/icons-material';
import { useCarpoolOfferForm } from '../../hooks/useCarpoolOfferForm.js';
import { israeliCities } from '../../data/cities.js';

// Custom iOS-style Time Picker Component
const IOSTimePicker = ({ label, value, onChange, error, helperText }) => {
    const [open, setOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState(value ? parseInt(value.split(':')[0]) : 18);
    const [selectedMinute, setSelectedMinute] = useState(value ? parseInt(value.split(':')[1]) : 0);
    const [touchStarted, setTouchStarted] = useState(false);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 15, 30, 45];

    const handleConfirm = () => {
        const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
        onChange(timeString);
        setOpen(false);
    };

    const handleTouchStart = (e) => {
        e.preventDefault();
        setTouchStarted(true);
    };

    const handleTouchEnd = (e) => {
        if (touchStarted) {
            e.preventDefault();
            setOpen(true);
        }
        setTouchStarted(false);
    };

    const handleTouchCancel = () => {
        setTouchStarted(false);
    };

    const handleMouseUp = (e) => {
        e.preventDefault();
        setOpen(true);
    };

    const handleMouseDown = (e) => {
        e.preventDefault(); // Prevent default but don't open dialog
    };

    const displayValue = value || '--:--';

    return (
        <>
            <TextField
                fullWidth
                label={label}
                value={displayValue}
                readOnly
                error={error}
                helperText={helperText}
                InputProps={{
                    endAdornment: <AccessTime sx={{ color: 'rgba(46, 125, 50, 0.6)' }} />,
                    style: { cursor: 'pointer' },
                    readOnly: true,
                    disableUnderline: false
                }}
                inputProps={{
                    readOnly: true,
                    tabIndex: -1,
                    inputMode: 'none',
                    autoComplete: 'off',
                    'data-lpignore': 'true',
                    'data-form-type': 'other',
                    onFocus: (e) => e.target.blur(),
                    onTouchStart: handleTouchStart,
                    onTouchEnd: handleTouchEnd,
                    onTouchCancel: handleTouchCancel,
                    onMouseDown: handleMouseDown,
                    onMouseUp: handleMouseUp
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(46, 125, 50, 0.3)' },
                        '&:hover fieldset': { borderColor: '#2e7d32' },
                        '&.Mui-focused fieldset': { borderColor: '#2e7d32' },
                        cursor: 'pointer'
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#2e7d32' },
                    '& .MuiInputBase-input': {
                        cursor: 'pointer',
                        caretColor: 'transparent !important',
                        '&:focus': {
                            caretColor: 'transparent !important',
                        }
                    }
                }}
            />
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        maxHeight: '70vh'
                    }
                }}
            >
                <DialogTitle sx={{
                    textAlign: 'center',
                    color: '#2e7d32',
                    fontWeight: 'bold',
                    pb: 1
                }}>
                    {label}
                </DialogTitle>
                <DialogContent sx={{ px: 0, pb: 0 }}>
                    <Box sx={{ display: 'flex', height: '300px' }}>
                        {/* Hours Column */}
                        <Box sx={{ flex: 1, borderLeft: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle2" sx={{
                                textAlign: 'center',
                                p: 1,
                                fontWeight: 'bold',
                                borderBottom: '1px solid #e0e0e0'
                            }}>
                                שעות
                            </Typography>
                            <List sx={{
                                height: '250px',
                                overflow: 'auto',
                                '&::-webkit-scrollbar': { width: '6px' },
                                '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
                                '&::-webkit-scrollbar-thumb': { background: '#2e7d32', borderRadius: '3px' }
                            }}>
                                {hours.map((hour) => (
                                    <ListItem key={hour} disablePadding>
                                        <ListItemButton
                                            selected={selectedHour === hour}
                                            onClick={() => setSelectedHour(hour)}
                                            sx={{
                                                justifyContent: 'center',
                                                py: 1.5,
                                                '&.Mui-selected': {
                                                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(46, 125, 50, 0.15)'
                                                    }
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={hour.toString().padStart(2, '0')}
                                                primaryTypographyProps={{
                                                    textAlign: 'center',
                                                    fontSize: '1.2rem',
                                                    fontWeight: selectedHour === hour ? 'bold' : 'normal',
                                                    color: selectedHour === hour ? '#2e7d32' : 'inherit'
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>

                        {/* Minutes Column */}
                        <Box sx={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle2" sx={{
                                textAlign: 'center',
                                p: 1,
                                fontWeight: 'bold',
                                borderBottom: '1px solid #e0e0e0'
                            }}>
                                דקות
                            </Typography>
                            <List sx={{
                                height: '250px',
                                overflow: 'auto',
                                '&::-webkit-scrollbar': { width: '6px' },
                                '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
                                '&::-webkit-scrollbar-thumb': { background: '#2e7d32', borderRadius: '3px' }
                            }}>
                                {minutes.map((minute) => (
                                    <ListItem key={minute} disablePadding>
                                        <ListItemButton
                                            selected={selectedMinute === minute}
                                            onClick={() => setSelectedMinute(minute)}
                                            sx={{
                                                justifyContent: 'center',
                                                py: 2,
                                                '&.Mui-selected': {
                                                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(46, 125, 50, 0.15)'
                                                    }
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={minute.toString().padStart(2, '0')}
                                                primaryTypographyProps={{
                                                    textAlign: 'center',
                                                    fontSize: '1.2rem',
                                                    fontWeight: selectedMinute === minute ? 'bold' : 'normal',
                                                    color: selectedMinute === minute ? '#2e7d32' : 'inherit'
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 2 }}>
                    <Button
                        onClick={() => setOpen(false)}
                        variant="outlined"
                        sx={{
                            borderColor: 'rgba(46, 125, 50, 0.5)',
                            color: '#2e7d32',
                            '&:hover': {
                                borderColor: '#2e7d32',
                                backgroundColor: 'rgba(46, 125, 50, 0.05)'
                            }
                        }}
                    >
                        בטל
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        sx={{
                            bgcolor: '#2e7d32',
                            '&:hover': { bgcolor: '#1b5e20' }
                        }}
                    >
                        אישור
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// Custom Paper component for Autocomplete dropdowns
const AutocompletePaper = (props) => {
    return (
        <Paper
            {...props}
            sx={{
                backgroundColor: '#ffffff !important',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                borderRadius: '8px',
                overflow: 'hidden',
                ...props.sx
            }}
        />
    );
};

const CarpoolOfferForm = ({ userId, onOfferCreated, onCancel }) => {
    const {
        formData,
        errors,
        isSubmitting,
        updateFormData,
        handleSubmit,
        submitError
    } = useCarpoolOfferForm(userId, onOfferCreated);

    const rideDirectionOptions = [
        { value: 'to', label: 'רק הגעה לחתונה' },
        { value: 'from', label: 'רק חזרה מהחתונה' },
        { value: 'both', label: 'הלוך ושוב' }
    ];

    const shouldShowFromCity = formData.rideDirection === 'to' || formData.rideDirection === 'both';

    return (
        <Fade in={true}>
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(5px)',
                    textAlign: 'center'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
                    <Typography variant="h4" component="h2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                        הצע טרמפ לחתונה
                    </Typography>
                    <DirectionsCar sx={{ mr: 1, color: '#2e7d32', fontSize: '2rem' }} />
                </Box>

                <form onSubmit={handleSubmit} style={{

                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1em',
                }}>
                    {/* Driver Information */}
                    <Typography variant="h6" sx={{ color: '#2e7d32', mb: 2, fontWeight: 'bold' }}>
                        פרטי הנהג
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="שם הנהג *"
                                value={formData.driverName}
                                onChange={(e) => updateFormData('driverName', e.target.value)}
                                error={!!errors.driverName}
                                helperText={errors.driverName}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'rgba(46, 125, 50, 0.3)' },
                                        '&:hover fieldset': { borderColor: '#2e7d32' },
                                        '&.Mui-focused fieldset': { borderColor: '#2e7d32' }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#2e7d32' }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="מספר טלפון *"
                                value={formData.phoneNumber}
                                onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                                error={!!errors.phoneNumber}
                                helperText={errors.phoneNumber}
                                variant="outlined"
                                placeholder="050-1234567"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'rgba(46, 125, 50, 0.3)' },
                                        '&:hover fieldset': { borderColor: '#2e7d32' },
                                        '&.Mui-focused fieldset': { borderColor: '#2e7d32' }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#2e7d32' }
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Trip Details */}
                    <Typography variant="h6" sx={{ color: '#2e7d32', mb: 2, fontWeight: 'bold' }}>
                        פרטי הנסיעה
                    </Typography>

                    {/* Ride Direction */}
                    <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                        <FormLabel
                            component="legend"
                            sx={{
                                color: '#2c2c2c',
                                '&.Mui-focused': { color: '#2e7d32' }
                            }}
                        >
                            כיוון הנסיעה *
                        </FormLabel>
                        <RadioGroup
                            value={formData.rideDirection}
                            onChange={(e) => updateFormData('rideDirection', e.target.value)}
                            sx={{
                                '& .MuiRadio-root': { color: 'rgba(46, 125, 50, 0.6)' },
                                '& .Mui-checked': { color: '#2e7d32' }
                            }}
                        >
                            {rideDirectionOptions.map((option) => (
                                <FormControlLabel
                                    key={option.value}
                                    value={option.value}
                                    control={<Radio />}
                                    label={option.label}
                                    sx={{
                                        '& .MuiFormControlLabel-label': {
                                            fontSize: '1rem',
                                            color: '#2c2c2c'
                                        }
                                    }}
                                />
                            ))}
                        </RadioGroup>
                        {errors.rideDirection && (
                            <FormHelperText error>{errors.rideDirection}</FormHelperText>
                        )}
                    </FormControl>

                    <Grid container spacing={2}>
                        {/* From City */}
                        {shouldShowFromCity && (
                            <Grid item xs={12} md={6} width={'100%'}>
                                <Autocomplete
                                    fullWidth
                                    options={israeliCities}
                                    value={formData.fromCity}
                                    onChange={(_, newValue) => updateFormData('fromCity', newValue || '')}
                                    PaperComponent={AutocompletePaper}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="עיר יציאה *"
                                            error={!!errors.fromCity}
                                            helperText={errors.fromCity}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': { borderColor: 'rgba(46, 125, 50, 0.3)' },
                                                    '&:hover fieldset': { borderColor: '#2e7d32' },
                                                    '&.Mui-focused fieldset': { borderColor: '#2e7d32' }
                                                },
                                                '& .MuiInputLabel-root.Mui-focused': { color: '#2e7d32' }
                                            }}
                                        />
                                    )}
                                    sx={{
                                        '& .MuiAutocomplete-option': {
                                            '&:hover': {
                                                backgroundColor: 'rgba(46, 125, 50, 0.1)'
                                            },
                                            '&.Mui-focused': {
                                                backgroundColor: 'rgba(46, 125, 50, 0.15)'
                                            }
                                        }
                                    }}
                                />
                            </Grid>
                        )}

                        {/* Return City for "from" direction */}
                        {formData.rideDirection === 'from' && (
                            <Grid item xs={12} md={6} width={'100%'}>
                                <Autocomplete
                                    options={israeliCities}
                                    value={formData.returnCity}
                                    onChange={(_, newValue) => updateFormData('returnCity', newValue || '')}
                                    PaperComponent={AutocompletePaper}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="עיר יעד לחזרה *"
                                            error={!!errors.returnCity}
                                            helperText={errors.returnCity}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': { borderColor: 'rgba(46, 125, 50, 0.3)' },
                                                    '&:hover fieldset': { borderColor: '#2e7d32' },
                                                    '&.Mui-focused fieldset': { borderColor: '#2e7d32' }
                                                },
                                                '& .MuiInputLabel-root.Mui-focused': { color: '#2e7d32' }
                                            }}
                                        />
                                    )}
                                    sx={{
                                        '& .MuiAutocomplete-option': {
                                            '&:hover': {
                                                backgroundColor: 'rgba(46, 125, 50, 0.1)'
                                            },
                                            '&.Mui-focused': {
                                                backgroundColor: 'rgba(46, 125, 50, 0.15)'
                                            }
                                        }
                                    }}
                                />
                            </Grid>
                        )}

                        {/* Available Seats */}
                        <Grid item xs={12} md={6} width={'100%'}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        '&.Mui-focused': { color: '#2e7d32' }
                                    }}
                                >
                                    מספר מקומות פנויים *
                                </InputLabel>
                                <Select
                                    value={formData.availableSeats}
                                    onChange={(e) => updateFormData('availableSeats', e.target.value)}
                                    error={!!errors.availableSeats}
                                    sx={{
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(46, 125, 50, 0.3)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#2e7d32'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#2e7d32'
                                        }
                                    }}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                        <MenuItem key={num} value={num}>
                                            {num} מקומות
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.availableSeats && (
                                    <FormHelperText error>{errors.availableSeats}</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* Different Return City for "both" direction */}
                    {formData.rideDirection === 'both' && (
                        <Box sx={{ mt: 2, width: '100%' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.differentReturnCity}
                                        onChange={(e) => updateFormData('differentReturnCity', e.target.checked)}
                                        sx={{
                                            color: 'rgba(46, 125, 50, 0.6)',
                                            '&.Mui-checked': { color: '#2e7d32' }
                                        }}
                                    />
                                }
                                label="חזרה לעיר אחרת"
                                sx={{
                                    '& .MuiFormControlLabel-label': {
                                        color: '#2c2c2c',
                                        fontSize: '1rem'
                                    }
                                }}
                            />

                            {formData.differentReturnCity && (
                                <Box sx={{ mt: 1, width: '100%' }}>
                                    <Autocomplete
                                        options={israeliCities}
                                        value={formData.returnCity}
                                        onChange={(_, newValue) => updateFormData('returnCity', newValue || '')}
                                        PaperComponent={AutocompletePaper}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="עיר חזרה"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': { borderColor: 'rgba(46, 125, 50, 0.3)' },
                                                        '&:hover fieldset': { borderColor: '#2e7d32' },
                                                        '&.Mui-focused fieldset': { borderColor: '#2e7d32' }
                                                    },
                                                    '& .MuiInputLabel-root.Mui-focused': { color: '#2e7d32' }
                                                }}
                                            />
                                        )}
                                        sx={{
                                            '& .MuiAutocomplete-option': {
                                                '&:hover': {
                                                    backgroundColor: 'rgba(46, 125, 50, 0.1)'
                                                },
                                                '&.Mui-focused': {
                                                    backgroundColor: 'rgba(46, 125, 50, 0.15)'
                                                }
                                            }
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Timing */}
                    <Typography variant="h6" sx={{ color: '#2e7d32', mb: 2, fontWeight: 'bold' }}>
                        זמני נסיעה
                    </Typography>

                    <Grid container spacing={2}>
                        {(formData.rideDirection === 'to' || formData.rideDirection === 'both') && (
                            <Grid item xs={12} md={6}>
                                <IOSTimePicker
                                    label="זמן יציאה"
                                    value={formData.departureTime}
                                    onChange={(timeString) => updateFormData('departureTime', timeString)}
                                    error={!!errors.departureTime}
                                    helperText={errors.departureTime}
                                />
                            </Grid>
                        )}

                        {(formData.rideDirection === 'from' || formData.rideDirection === 'both') && (
                            <Grid item xs={12} md={6}>
                                <IOSTimePicker
                                    label="זמן חזרה"
                                    value={formData.returnTime}
                                    onChange={(timeString) => updateFormData('returnTime', timeString)}
                                    error={!!errors.returnTime}
                                    helperText={errors.returnTime}
                                />
                            </Grid>
                        )}
                    </Grid>

                    {/* Additional Information */}
                    <TextField
                        fullWidth
                        label="מידע נוסף"
                        value={formData.additionalInfo}
                        onChange={(e) => updateFormData('additionalInfo', e.target.value)}
                        multiline
                        rows={3}
                        placeholder="דרישות מיוחדות, נקודות איסוף, הערות לנוסעים..."
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: 'rgba(46, 125, 50, 0.3)' },
                                '&:hover fieldset': { borderColor: '#2e7d32' },
                                '&.Mui-focused fieldset': { borderColor: '#2e7d32' }
                            },
                            '& .MuiInputLabel-root.Mui-focused': { color: '#2e7d32' }
                        }}
                    />

                    {/* Submit Error */}
                    {submitError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            שגיאה ביצירת הצעת הטרמפ. אנא נסה שוב.
                        </Alert>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            endIcon={<Send />}
                            disabled={isSubmitting}
                            size="large"
                            sx={{
                                minWidth: 200,
                                py: 1.5,
                                fontSize: '1.1rem',
                                bgcolor: '#2e7d32',
                                '&:hover': {
                                    bgcolor: '#1b5e20',
                                    transform: 'scale(1.05)'
                                },
                                '&:disabled': {
                                    opacity: 0.7,
                                    transform: 'none'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {isSubmitting ? 'שומר...' : 'הצע טרמפ'}
                        </Button>

                        <Button
                            type="button"
                            variant="outlined"
                            endIcon={<Cancel />}
                            onClick={onCancel}
                            size="large"
                            sx={{
                                minWidth: 200,
                                py: 1.5,
                                fontSize: '1.1rem',
                                borderColor: 'rgba(46, 125, 50, 0.5)',
                                color: '#2e7d32',
                                '&:hover': {
                                    borderColor: '#2e7d32',
                                    backgroundColor: 'rgba(46, 125, 50, 0.05)',
                                    transform: 'scale(1.05)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            בטל
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Fade>
    );
};

export default CarpoolOfferForm;
