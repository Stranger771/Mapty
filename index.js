'use strict';
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  id = this._idGen();
  date = new Date();
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _idGen() {
    const arr = [];
    for (let i = 0; i <= 4; i++) {
      const randNum = Math.floor(Math.random() * 1000 + 100);
      arr.push(randNum);
    }
    return arr.join('-');
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._pace();
    this._setDescription();
  }
  _pace() {
    this.pace = (this.duration / this.distance).toFixed(2);
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elvationGain) {
    super(coords, distance, duration);
    this.elvationGain = elvationGain;
    this._speed();
    this._setDescription();
  }
  _speed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(2);
  }
}

class App {
  #map;
  #marker = [];
  #workouts = [];
  #mapEvent;
  #isVisible = false;
  constructor() {
    this._getPosition();
    inputType.addEventListener('change', this._toggleClass);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
    this._getLocalStorage();
    window.addEventListener('click', this._hideOptions.bind(this));
  }

  _getPosition() {
    console.log(this);
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      this._errorMessage
    );
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    console.log(latitude, longitude);
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }
  _newWorkout(e) {
    e.preventDefault();
    const inputValidationNumber = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allNumberPositive = (...inputs) => inputs.every(input => input > 0);
    console.log(this.#mapEvent);
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !inputValidationNumber(distance, duration, cadence) ||
        !allNumberPositive(distance, duration, cadence)
      )
        return this._errorMessage();
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type === 'cycling') {
      const elvation = +inputElevation.value;
      if (
        !inputValidationNumber(distance, duration, elvation) ||
        !allNumberPositive(distance, duration)
      )
        return this._errorMessage();
      workout = new Cycling([lat, lng], distance, duration, elvation);
    }
    console.log(workout);
    this.#workouts.push(workout);
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._setLocalStorage();
    this._hideForm();
  }
  _showForm(mapEve) {
    this.#mapEvent = mapEve;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleClass(e) {
    form
      .querySelector('.form__input--cadence')
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
    form
      .querySelector('.form__input--elevation')
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
  }
  _renderWorkoutMarker(workout) {
    this.#marker.push(
      L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
          L.popup({
            maxWidth: 300,
            minWidth: 150,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
          })
        )
        .setPopupContent(`${workout.description}`)
        .openPopup()
    );
  }
  _errorMessage() {
    alert('Error');
  }
  _renderWorkout(workout) {
    const html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.description}</h2>
          
<p class="option-dots">...</p>
          <div class="workout-options workout-options--hidden">
            <ul>
              <li>Delete Workout</li>
              <li>Edit</li>
            </ul>
          </div>

          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              workout.type === 'running' ? workout.pace : workout.speed
            }</span>
            <span class="workout__unit">${
              workout.type === 'running' ? 'min/km' : 'km/min'
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🦶🏼' : '⛰'
            }</span>
            <span class="workout__value">${
              workout.type === 'running'
                ? workout.cadence
                : workout.elvationGain
            }</span>
            <span class="workout__unit">${
              workout.type === 'running' ? 'spm' : 'm'
            }</span>
          </div>
        </li>`;
    form.insertAdjacentHTML('afterend', html);
    document
      .querySelector('.workout-options ul li')
      .addEventListener('click', this._removeWorkout.bind(this));
    document
      .querySelector('.option-dots')
      .addEventListener('click', this._showOptions.bind(this));
    document
      .querySelectorAll('.workout-options ul li')[1]
      .addEventListener('click', this._edit.bind(this));
  }
  _moveToMarker(e) {
    if (e.target !== document.querySelector('.option-dots')) {
      if (!e.target.closest('.workout')) return;
      const workoutEl = e.target.closest('.workout');
      const moveTo = this.#workouts.find(
        workout => workout.id === workoutEl.dataset.id
      );
      if (!moveTo) return;
      this.#map.setView(moveTo.coords, 13, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }
  }
  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }
  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
  _showOptions(e) {
    e.stopPropagation();
    const target = e.target
      .closest('.workout')
      .querySelector('.workout-options');
    document.querySelectorAll('.workout-options').forEach(option => {
      if (option !== target) {
        option.classList.add('workout-options--hidden');
      }
    });
    target.classList.remove('workout-options--hidden');
    this.#isVisible = true;
  }
  _hideOptions(e) {
    if (this.#isVisible) {
      document
        .querySelectorAll('.workout-options')
        .forEach(option => option.classList.add('workout-options--hidden'));
      this.#isVisible = false;
    }
  }
  _removeWorkout(e) {
    const target = e.target.closest('.workout');
    const index = this.#workouts.findIndex(
      workout => workout.id === target.dataset.id
    );
    if (index !== -1) {
      document
        .querySelector(`.workout[data-id="${this.#workouts[index].id}"]`)
        .remove();
      this.#marker[index].remove();
      this.#marker.splice(index, 1);
      this.#workouts.splice(index, 1);
    }
    this._setLocalStorage();
  }

  ////////////////////////////////

  _edit(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const id = workoutEl.dataset.id;
    const workoutIndex = this.#workouts.findIndex(w => w.id === id);
    const workout = this.#workouts[workoutIndex];

    // Show form and pre-fill inputs
    form.classList.remove('hidden');
    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;

    if (workout.type === 'running') {
      inputCadence.value = workout.cadence;
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
    } else {
      inputElevation.value = workout.elvationGain;
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
    }

    // When form is submitted, update instead of adding
    form.onsubmit = ev => {
      ev.preventDefault();

      const distance = +inputDistance.value;
      const duration = +inputDuration.value;

      if (workout.type === 'running') {
        const cadence = +inputCadence.value;
        Object.assign(workout, { distance, duration, cadence });
        workout._pace();
      } else {
        const elvationGain = +inputElevation.value;
        Object.assign(workout, { distance, duration, elvationGain });
        workout._speed();
      }

      workout._setDescription();

      // Update DOM
      workoutEl.querySelector('.workout__title').textContent =
        workout.description;
      workoutEl.querySelectorAll('.workout__value')[0].textContent =
        workout.distance;
      workoutEl.querySelectorAll('.workout__value')[1].textContent =
        workout.duration;
      workoutEl.querySelectorAll('.workout__value')[2].textContent =
        workout.type === 'running' ? workout.pace : workout.speed;
      workoutEl.querySelectorAll('.workout__value')[3].textContent =
        workout.type === 'running' ? workout.cadence : workout.elvationGain;

      // Save to local storage
      this._setLocalStorage();

      // Hide form again
      this._hideForm();
      form.onsubmit = this._newWorkout.bind(this); // Restore normal behavior
    };
  }
}
const app = new App();
// const testClick = document.querySelector('.option-dots');
// let isVisible = false;
// testClick.addEventListener('click', function (e) {
//   e.stopPropagation();
//   document
//     .querySelector('.workout-options')
//     .classList.remove('workout-options--hidden');
//   isVisible = true;
// });

//obtaining data is done
//left:
//render data
//move to marker
//store
