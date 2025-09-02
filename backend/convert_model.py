import tensorflow as tf
import tf2onnx
import os

# The Keras model may use a custom layer, so we need to define it to load the model.
# This custom class handles a legacy issue with some Keras models.
class CustomDepthwiseConv2D(tf.keras.layers.DepthwiseConv2D):
    def __init__(self, **kwargs):
        if 'groups' in kwargs:
            del kwargs['groups']
        super().__init__(**kwargs)

keras_model_path = "keras_model.h5"
onnx_model_path = "model.onnx"

if not os.path.exists(keras_model_path):
    print(f"Error: Keras model file not found at '{keras_model_path}'")
    exit()

# Load the Keras model with the custom layer.
print("Loading Keras model...")
try:
    model = tf.keras.models.load_model(
        keras_model_path,
        compile=False,
        custom_objects={'DepthwiseConv2D': CustomDepthwiseConv2D}
    )
    print("Keras model loaded successfully.")
except Exception as e:
    print(f"Error loading Keras model: {e}")
    exit()

# Define the input signature for the model. This is important for the converter to know
# the shape and type of the input tensor.
# (None, 224, 224, 3) means:
# - None: Batch size can be variable.
# - 224, 224: Height and width of the image.
# - 3: Number of color channels (RGB).
spec = (tf.TensorSpec((None, 224, 224, 3), tf.float32, name="input"),)

# Convert the model to ONNX.
# The `opset` is important for compatibility. 13 is a good, widely supported version.
print("Converting model to ONNX format...")
try:
    model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec, opset=13)
    with open(onnx_model_path, "wb") as f:
        f.write(model_proto.SerializeToString())
    print(f"Successfully converted '{keras_model_path}' to '{onnx_model_path}'")
except Exception as e:
    print(f"Error converting model to ONNX: {e}")
