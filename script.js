'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/////////////////////////////
//Workout classes
class workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  createTitle() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.title = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class running extends workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.createTitle();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class cycling extends workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this.createTitle();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////////
//Application architecture
class App {
  #map;
  #mapEvent;
  workouts = [];
  constructor() {
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._candeceEleveation);

    containerWorkouts.addEventListener('click', this._movePopup.bind(this));

    this._setLocalStorage();
  }

  _getPosition() {
    //get coordinates and invoke loading the map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Application depends on your location so it cant work');
        }
      );
    }
  }

  _loadMap(pos) {
    //get coords
    const { longitude } = pos.coords;
    const { latitude } = pos.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 15);

    //show map
    L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
        })
      )
      .setPopupContent('Current Location.')
      .openPopup();
    //Leaflet even handler for clicks on map
    this.#map.on('click', this._showForm.bind(this));

    //load data
    this.workouts.forEach(w => this._markerOnMap(w));
  }

  _showForm(mapE) {
    //set the map event
    this.#mapEvent = mapE;

    //show the form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //clear values
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    //hide form with animation
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(function () {
      form.style.display = 'grid';
    }, 1000);
  }

  _newWorkout(e) {
    e.preventDefault();
    //some needed functions
    const allNumbers = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;

    //creating objects as per the type
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !allNumbers(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs must be positive numbers only');
      }
      workout = new running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !allNumbers(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs must be positive numbers only');
      }
      workout = new cycling([lat, lng], distance, duration, elevation);
    }
    //pushing to the array
    this.workouts.push(workout);

    //putting marker on map
    this._markerOnMap(workout);

    //render workout
    this._renderWorkout(workout);

    //hide form
    this._hideForm();

    //store into local storage
    this._setLocalStorage();
  }

  _candeceEleveation() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _markerOnMap(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴🏻'} ${workout.title}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.title}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴🏻'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }
    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _movePopup(e) {
    if (!this.#map) return;

    const workoutElement = e.target.closest('.workout');
    if (!workoutElement) return;

    const workout = this.workouts.find(w => w.id === workoutElement.dataset.id);

    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1.2,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.workouts = data;

    this.workouts.forEach(w => this._renderWorkout(w));
  }

  _reset() {
    localStorage.removeItem('workouts');
    location.reload;
  }
}

const app = new App();
