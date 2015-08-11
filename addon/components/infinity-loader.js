import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ["infinity-loader"],
  classNameBindings: ["infinityModel.reachedInfinity"],
  guid: null,
  eventDebounce: 10,
  loadMoreAction: 'infinityLoad',
  loadingText: 'Loading Infinite Model...',
  loadedText: 'Infinite Model Entirely Loaded.',
  destroyOnInfinity: false,
  developmentMode: false,
  scrollable: null,
  threshold: 250,

  didRender() {
    this._super(...arguments);
    this._checkIfInView();
  },

  didInsertElement() {
    this._super(...arguments);
    this._setupScrollable();
    this._bindEvent('scroll');
    this._bindEvent('resize');
    this._checkIfInView();
  },

  init: function() {
    this._super(...arguments);
    this.set('guid', Ember.guidFor(this));
  },

  willDestroyElement() {
    this._super(...arguments);
    this._unbindEvent('scroll');
    this._unbindEvent('resize');
    this.set('scrollable', this.get('scrollableStr'));
  },

  _bindEvent(eventName) {
    this.get('scrollable').on(`${eventName}.${this.get('guid')}`, () => {
      Ember.run.debounce(this, this._checkIfInView, this.get('eventDebounce'));
    });
  },

  _unbindEvent(eventName) {
    this.get('scrollable').off(`${eventName}.${this.get('guid')}`);
  },

  _checkIfInView() {
    if (this.get('developmentMode')) { return; }
    var loaderTop = this.$().position().top;
    if (loaderTop + this.$().height() <= 0) { return; }
    if (loaderTop < this.get('scrollable').height() + this.get('threshold')) {
      this.sendAction('loadMoreAction');
    }
  },

  _setupScrollable() {
    var scrollable = this.get('scrollable');
    if (Ember.typeOf(scrollable) === 'string') {
      this.set('scrollableStr', scrollable);
      var items = Ember.$(scrollable);
      if (items.length === 1) {
        this.set('scrollable', items.eq(0));
      } else if (items.length > 1) {
        throw new Error("Multiple scrollable elements found for: " + scrollable);
      } else {
        throw new Error("No scrollable element found for: " + scrollable);
      }
    } else {
      this.set('scrollable', Ember.$(window));
    }
  },

  loadedStatusDidChange: Ember.observer('infinityModel.reachedInfinity', 'destroyOnInfinity', function () {
    if (this.get('infinityModel.reachedInfinity') && this.get('destroyOnInfinity')) {
      this.destroy();
    }
  }),

  infinityModelPushed: Ember.observer('infinityModel.length', function() {
    Ember.run.scheduleOnce('afterRender', this, this._checkIfInView);
  })
});
