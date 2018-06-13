import Vue from 'vue'
import Figure1 from './components/figure1.vue'

document.addEventListener("DOMContentLoaded", function() {
	new Vue({
		el: '#figure1',
		render: h => h(Figure1)
	});
});