
import * as tf from '@tensorflow/tfjs'


export function createModel(type: "densenet" | "perceptron" | "resnet", scale: number, bw = false, seed?: number): tf.Model {
    let init = tf.initializers.varianceScaling({ scale: scale, mode: 'fanIn', distribution: 'normal', seed })
    let binit = tf.initializers.zeros() // tf.initializers.randomNormal({ mean: 0, stddev: 4 })
    let input = tf.input({ shape: [ 4 ] })

    let x: tf.SymbolicTensor = input

    switch (type) {
        case "densenet":
            x = densenet(x, init);
            break;
        case "perceptron":
            x = perceptron(x, init);
            break;
        case "resnet":
            x = resnet(x, init);
            break;
    }

    x = tf.layers.dense({ units: bw ? 1 : 3, activation: 'tanh', kernelInitializer: tf.initializers.glorotNormal({ seed }) }).apply(x) as tf.SymbolicTensor

    return tf.model({ inputs: input, outputs: x })
}

function densenet(x: tf.SymbolicTensor, init: any): tf.SymbolicTensor {
    const depth = 8
    const width = 8
    for (var i = 0; i < depth; ++i) {
        let y = tf.layers.dense({ units: width, kernelInitializer: init, activation: 'sigmoid' }).apply(x) as tf.SymbolicTensor
        x = tf.layers.concatenate({}).apply([x, y]) as tf.SymbolicTensor
    }

    return x
}

function perceptron(x: tf.SymbolicTensor, init: any): tf.SymbolicTensor {
    const depth = 8
    const width = 32
    for (var i = 0; i < depth; ++i) {
        x = tf.layers.dense({ units: width, kernelInitializer: init, activation: 'tanh' }).apply(x) as tf.SymbolicTensor
    }

    return x
}

function resnet(x: tf.SymbolicTensor, init: any): tf.SymbolicTensor {
    const depth = 8
    const width = 32
    for (var i = 0; i < depth; ++i) {
        let y: tf.SymbolicTensor
        if (i != 0)
            y = tf.layers.activation({ activation: 'tanh' }).apply(x) as tf.SymbolicTensor
        else
            y = x

        y = tf.layers.dense({ units: width, kernelInitializer: init, activation: 'tanh' }).apply(x) as tf.SymbolicTensor
        
        let x_ = x
        if (x_.shape[1] != width)
            x_ = tf.layers.dense({ units: width, kernelInitializer: init }).apply(x_) as tf.SymbolicTensor
        
        x = tf.layers.add().apply([x_, y]) as tf.SymbolicTensor
    }

    x = tf.layers.activation({ activation: 'tanh' }).apply(x) as tf.SymbolicTensor

    return x
}