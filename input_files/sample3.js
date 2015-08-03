/**
 * Created by traveloka on 03/08/15.
 */
var Person = function () {
  console.log('This is the constructor.');
};

Person.prototype.getAge = function (birthYear) {
  var age = 2015;
  age -= birthYear;

  return result;
};

Object.defineProperty(Person.prototype, 'age', {
  get: function () {
    return this.getAge();
  }
});

var personsUtils = {
  getName: function (person) {
    return person.firstname + ' ' + person.lastname;
  },
  logInformation: function (person) {
    var message = 'You are ' + person.age;
    console.log(message);
  }
};

setTimeout(function() {
  alert('Having some fun !');
});