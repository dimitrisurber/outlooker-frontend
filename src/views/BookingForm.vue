const form = ref({
  name: '',
  phone: '',
  manufacturer: '',
  year: '',
  date: '',
  time: '',
  service: '',
  userId: route.params.userId,
  duration: 30 // Default duration in minutes
});

const submitForm = async () => {
  if (!isFormValid.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`${apiBaseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.value.name,
        phone: form.value.phone,
        date: form.value.date,
        time: form.value.time,
        userId: form.value.userId,
        carManufacturer: form.value.manufacturer,
        carYear: form.value.year,
        duration: form.value.duration,
        service: form.value.service
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      router.push({
        name: 'BookingSuccess',
        params: {
          ...form.value,
          eventId: data.eventId,
          duration: form.value.duration
        }
      });
    } else {
      error.value = data.error || 'Failed to create booking';
    }
  } catch (err) {
    console.error('Error creating booking:', err);
    error.value = 'Failed to create booking';
  } finally {
    loading.value = false;
  }
}; 