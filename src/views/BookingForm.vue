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
        userId: form.value.userId,
        appointmentDate: form.value.date,
        appointmentTime: form.value.time,
        customerDetails: {
          name: form.value.name,
          phone: form.value.phone,
          carManufacturer: form.value.manufacturer,
          carYear: form.value.year,
          service: form.value.service
        },
        duration: form.value.duration
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Extract eventId from nested booking object if available
      const eventId = data.booking?.eventId || data.eventId || 'pending';
      router.push({
        name: 'BookingSuccess',
        params: {
          ...form.value,
          eventId: eventId,
          duration: form.value.duration,
          status: data.booking?.status || 'synced'
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