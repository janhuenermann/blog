<template>
    <figure class="full-width" id=figure1>

    	<div class="figure1__application">
    		<div class="figure1__canvas">
    			<div :style="{ 'padding-bottom': height / width * 100 + '%' }">
			    	<canvas id="art-generator" :width="width" :height="height"></canvas>
			    </div>
		    </div>
	    	<div class="figure1__panel">
		    	<div class="figure1__controls">
		    		<div class="figure1__control figure1__select">
						<label>Topology</label>
						<select selected="densenet" v-model="topology" @change="newModel()">
							<option value="perceptron">Perceptron</option>
							<option value="resnet">ResNet</option>
							<option value="densenet">DenseNet</option>
						</select>
					</div>
		    		<div class="figure1__control">
		    			<label>Z</label>
						<div class="figure1__slider">
							<input type=range
								name=time @input="update()" 
								v-model=timeString
								min="-4" max="4" step="0.1">
							<span>{{ time }}</span>
						</div>
					</div>
					<div class="figure1__control">
						<label>Variance</label>
						<div class="figure1__slider">
							<input type=range
								name=varianceLog @change="newModel()"
								v-model=varianceLog
								min=3 max=13 step="0.1">
							<span>{{ variance.toFixed(1) }}</span>
						</div>
					</div>

					<div class="figure1__control figure1__checkbox">
						<label>B/W</label>
						<input type=checkbox v-model=bw @change="newModel()">
					</div>

					<div class="figure1__control">
						<label>Seed</label>
						<input name=seed type=number v-model=seed @change="newModel()">
						<p style="font-size: 0.75em; line-height: 1.5; margin-top: 12px;">Think you discovered something cool? use this link to <a :href="url">share it</a></p>
					</div>
				</div>
				<div class="figure1__info">
					<div class="figure1__info-text round" v-if="!done">Round {{round}}</div>
					<div class="figure1__info-text done" v-else><a target="_blank" id=download @click="download()">Download image</a></div>
					
					<div class="figure1__progress" :style="{ transform: 'scaleX(' + progress + ')' }"></div>
					<div class="figure1__device">
						<span>Running on {{device.toUpperCase()}}</span>
					</div>
				</div>
			</div>
		</div>

		<figcaption><p>Figure 1: generate your own patterns. </p></figcaption>

    </figure>
</template>

<script lang="ts">

import * as tf from '@tensorflow/tfjs'
import $ from 'jquery'
import { Vue, Component, Prop } from 'vue-property-decorator'

import runOnScreen from '../helper/runonscreen'

import { createModel } from '../model'
import { render, RenderedImage } from "../render"

function getQueryStringValue (key) {  
  return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
}  

function getTopology() {
	let v = getQueryStringValue("t")
	if (v == '3')
		return 'resnet'
	else if (v == '2')
		return 'perceptron'
	else
		return 'densenet'
}


@Component
export default class Figure1 extends Vue {

	seed: string = getQueryStringValue("s") || '' + Math.round(Math.random() * 1e10)
	timeString: string = getQueryStringValue("z") || "0"
	varianceLog: string = getQueryStringValue("v") || "8"
	bw = getQueryStringValue("bw") == "1" || false
	topology: string = getTopology()

	width = 0
	height = 0

	model: tf.Model
	renderStorage = new Map<number, RenderedImage>()

	progress: number = 1
	round: number = 1

	currentRender: IterableIterator<any>
	numberOfRuns = 0

	device: string = tf.getBackend() == 'webgl' ? 'gpu' : 'cpu'

	mounted () {
		runOnScreen(this.$el, () => {
			if (this.currentRender) {
				if (this.currentRender.next().done) {
					this.currentRender = null
				}
			}
		}, 83)

		$('.seed-figure figure').on('click', (e) => {
			let d = $(e.delegateTarget).find('input.art-props').val()
			let data = JSON.parse(d)
			
			this.seed = "" + data.seed
			this.timeString = "" + data.time
			this.varianceLog = "" + (Math.log(data.variance) / Math.log(2))
			this.bw = data.bw || false
			this.topology = data.topology || "densenet"
			this.newModel()
		})

		this.resize()

		window.addEventListener('resize', () => this.resize())

		this.newModel()
	}

	resize () {
		let [ w, h ] = [ this.width, this.height ]
		
		if (window.innerWidth <= 800) {
			this.width = 512
			this.height = 768
		}
		else {
			this.width = 1024
			this.height = 512 
		}

		if (w != this.width || h != this.height) {
			this.renderStorage.clear()
			this.update()
		}
	}

	get done () {
		return this.progress == 1
	}

	get time() {
		return parseFloat(this.timeString)
	}

	get variance() {
		return Math.pow(2, parseFloat(this.varianceLog))
	}

	get url() {
		let topology = this.topology == 'resnet' ? '3' :
						this.topology == 'perceptron' ? '2' : '1'

		return window.location.href + '?s=' + this.seed + '&bw=' + (this.bw ? '1' : '0') + '&v=' + this.varianceLog + "&z=" + this.time.toFixed(1) + "&t=" + topology + '#figure1'
	}

	update () {
		if (!this.model) {
			return 
		}

		const canvas = this.$el.querySelector("canvas")

		this.currentRender = render(this.model, this.renderStorage, canvas, this.time, (r, p) => (this.round = r) && (this.progress = p))

		if (this.numberOfRuns == 0) {
			this.$nextTick(() => {
				for (var k = 0; k < 4; ++k) {
					this.currentRender.next() }
			})
		}

		this.numberOfRuns += 1
	}

	newModel () {
		this.model = createModel(this.topology as any, this.variance, this.bw == true, parseInt(this.seed))
		this.renderStorage.clear()

		this.update()
	}

	download() {
		const canvas = this.$el.querySelector("canvas")
		const link = this.$el.querySelector("a#download") as HTMLAnchorElement

		link.href = canvas.toDataURL("image/png")
    	link.download = "generated-image.png"
	}

}
</script>

<style lang="scss" src="./figure1.scss">
</style>
