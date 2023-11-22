import { Button, Form, Input, Modal, message } from "antd";
import { Html5Qrcode } from "html5-qrcode";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from "react-image-crop";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";
import ScanBarcode from "./ScanBarcode";
import "react-image-crop/dist/ReactCrop.css";
import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import Tesseract from "tesseract.js";
import Webcam from "react-webcam";
import { BrowserBarcodeReader } from "@zxing/library";

// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const layout = {
  labelCol: {
    span: 8,
  },
  wrapperCol: {
    span: 16,
  },
};

const ImageOcrApp: React.FC = () => {
  const [imgSrc, setImgSrc] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const [barcodeResult, setBarcodeResult] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  const [form] = Form.useForm();
  const [outputText, setOutputText] = useState<string>("");
  const [webcamRef, setWebcamRef] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    barcodeText: "",
    airline: "",
    passengerName: "",
    fromCode: "",
    ToCode: "",
    dateTime: "",
  });

  const [selectImage, setSelectImage] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if barcodeResult is available
    if (barcodeResult) {
      // Update the formData with barcodeResult
      setFormData((prevFormData: any) => ({
        ...prevFormData,
        barcodeText: barcodeResult,
      }));

      form.setFieldsValue((prevFormData: any) => ({
        ...prevFormData,
        barcodeText: barcodeResult,
      }));
    }
  }, [barcodeResult]); // Run this effect whenever barcodeResult changes

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    // setIsLoading(false);
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setBarcodeResult("");
    setOutputText("");
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    const image = files[0];
    const imageUrl = URL.createObjectURL(image);
    setSelectedImage(imageUrl);
    processImage(image);
  };

  const handleCaptureFromWebcam = () => {
    openModal();
  };

  const handleCaptureImage = async () => {
    setIsModalOpen(false);
    if (webcamRef) {
      setIsLoading(true);

      const imageSrc = webcamRef.getScreenshot();
      const base64 = imageSrc.split(",")[1];
      const imgBuffer = Buffer.from(base64, "base64");
      const imgUint8Array = new Uint8Array(imgBuffer);
      const imgNumberArray = Array.from(imgUint8Array);
      const imgBase64 = btoa(String.fromCharCode.apply(null, imgNumberArray));

      // const imageUrl = URL.createObjectURL(imgBase64);
      setSelectedImage(`data:image/jpeg;base64,${imgBase64}`);
      // Close the modal before processing the image
      closeModal();

      await processImage(imgBase64);
    }
  };

  const processImage = async (imgBase64: any) => {
    try {
      setIsLoading(true);
      const result = await Tesseract.recognize(imgBase64, "eng", {
        logger: (info: any) => console.log(info),
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        tessedit_ocr_engine_mode: 3,
      } as any);

      if (result && result.data && result.data.text) {
        setOutputText(result.data.text);
      } else {
        console.error("Error reading text from the image");
      }
      message.success("Image successfully processed");
    } catch (error) {
      console.error("Error during OCR:", error);
    } finally {
      // Set loading to false when OCR is complete, whether successful or not
      setIsLoading(false);
      closeModal(); // Now close the modal
    }
  };

  const handleInputData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((prevState: any) => {
      return {
        ...prevState,
        [name]: value,
      };
    });
  };

  const onFinish = (values: any) => {
    console.log("Form values:", values);
    // You can further process or submit the form data here
  };

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    setOutputText("");
    setImgSrc("");
    setResult(null);
    setSelectImage(e);
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  async function onDownloadCropClick() {
    try {
      setResult(null);
      setBarcodeResult(null);
      const image = imgRef.current;
      console.log("image", image);
      const previewCanvas = previewCanvasRef.current;
      console.log(image, previewCanvas, completedCrop);
      if (!image || !previewCanvas || !completedCrop) {
        throw new Error("Crop canvas does not exist");
      }

      // This will size relative to the uploaded image
      // size. If you want to size according to what they
      // are looking at on screen, remove scaleX + scaleY
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const offscreen = new OffscreenCanvas(
        completedCrop.width * scaleX,
        completedCrop.height * scaleY
      );
      const ctx = offscreen.getContext("2d");
      if (!ctx) {
        throw new Error("No 2d context");
      }

      ctx.drawImage(
        previewCanvas,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height,
        0,
        0,
        offscreen.width,
        offscreen.height
      );
      // You might want { type: "image/jpeg", quality: <0 to 1> } to
      // reduce image size
      const blob = await offscreen.convertToBlob({
        type: "image/png",
      });

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = URL.createObjectURL(blob);
      // setBarcodeResult(blobUrlRef.current);
      console.log("blobUrlRef.current", blobUrlRef.current);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        getQRCode(base64data);
      };
      reader.readAsDataURL(blob);

      // hiddenAnchorRef.current!.href = blobUrlRef.current;
      // hiddenAnchorRef.current!.click();
    } catch (error: any) {
      message.destroy();
      message.error(error.message || "An error occurred");
    }
  }

  function base64ImageToBlob(str: string): Blob {
    // extract content type and base64 payload from the original string
    var pos = str.indexOf(";base64,");
    var type = str.substring(5, pos);
    var b64 = str.substr(pos + 8);

    // decode base64
    var imageContent = atob(b64);

    // create an ArrayBuffer and a view (as unsigned 8-bit)
    var buffer = new ArrayBuffer(imageContent.length);
    var view = new Uint8Array(buffer);

    // fill the view, using the decoded base64
    for (var n = 0; n < imageContent.length; n++) {
      view[n] = imageContent.charCodeAt(n);
    }

    // convert ArrayBuffer to Blob
    var blob = new Blob([buffer], { type: type });
    return blob;
  }

  function getQRCode(imageBase64: string): void {
    var imageBlob = base64ImageToBlob(imageBase64);

    const html5QrCode = new Html5Qrcode("reader");
    const imageFile = new File([imageBlob], "image.png", { type: "image/png" });

    html5QrCode
      .scanFile(imageFile, false)
      .then((qrCodeMessage: any) => {
        setBarcodeResult(qrCodeMessage);
        setResult(qrCodeMessage);
        console.log("qrCodeMessage", qrCodeMessage);
        message.destroy();
        message.success("Barcode Scan Successfully");
      })
      .catch((err: any) => {
        console.log(`Error scanning file. Reason: ${err}`);
        message.destroy();
        message.error(`Error scanning file. Reason: ${err}`);
      });
  }

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate
        );
      }
    },
    100,
    [completedCrop, scale, rotate]
  );

  function handleToggleAspectClick() {
    if (aspect) {
      setAspect(undefined);
    } else {
      setAspect(16 / 9);

      if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerAspectCrop(width, height, 16 / 9);
        setCrop(newCrop);
        // Updates the preview
        setCompletedCrop(convertToPixelCrop(newCrop, width, height));
      }
    }
  }

  const handleDecodedText = (value: string) => {
    message.destroy();
    message.success(`Scan Successfully Barcode: ${value}`);
    setResult(value);
    setBarcodeResult(value);
    window.scrollTo(0, 0);
  };

  const handleShowScanner = (value: boolean) => {
    setShowScanner(value);
  };

  const [modalVisible, setModalVisible] = useState(false);

  // State for storing the captured image
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Reference to the webcam component
  const webcamRef1 = React.useRef<Webcam>(null);

  // Function to handle the click event and open the modal
  const handleButtonClick = () => {
    setModalVisible(true);
  };

  // Function to handle capturing the image
  const handleCapture = async () => {
    const imageSrc: any = webcamRef1.current?.getScreenshot();
    setCapturedImage(imageSrc);
    setSelectedImage(imageSrc);

    await processImage(imageSrc);
    // setModalVisible(false); // Close the modal after capturing
  };

  // Function to handle closing the modal
  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <div className="App">
      <div className="Crop-Controls">
        {/* <button onClick={handleCaptureFromWebcam}>Capture from Webcam</button> */}

        <input type="file" accept="image/*" onChange={onSelectFile} />
        <Button
          className="gx-mb-0 button-gradiant"
          onClick={handleShowScanner.bind(this, true)}
        >
          Scan Barcode
        </Button>
        <Button
          className="gx-mb-0 button-gradiant"
          onClick={() => handleImageChange(selectImage)}
        >
          Detect Text
        </Button>

        <Button
          className="gx-mb-0 button-gradiant"
          onClick={onDownloadCropClick}
        >
          Detect Barcode
        </Button>

        {/* <h1>Barcode Id: {result}</h1> */}

        <div id="reader"></div>
        {/* <div>
          <label htmlFor="scale-input">Scale: </label>
          <input
            id="scale-input"
            type="number"
            step="0.1"
            value={scale}
            disabled={!imgSrc}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="rotate-input">Rotate: </label>
          <input
            id="rotate-input"
            type="number"
            value={rotate}
            disabled={!imgSrc}
            onChange={(e) =>
              setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))
            }
          />
        </div>
        <div>
          <button onClick={handleToggleAspectClick}>
            Toggle aspect {aspect ? "off" : "on"}
          </button>
        </div> */}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginTop: "20px",
        }}
      >
        <div>
          {!!imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              // aspect={aspect}
              // minWidth={5}
              minHeight={5}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                onLoad={onImageLoad}
                height={500}
                width={400}
              />
            </ReactCrop>
          )}
          {!!completedCrop && imgSrc && (
            <>
              <div style={{ display: "none" }}>
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    border: "1px solid black",
                    objectFit: "contain",
                    width: completedCrop.width,
                    height: completedCrop.height,
                  }}
                />
              </div>

              <div>
                {/* {imgSrc && (
                  <div>
                    <Button
                      className="gx-mb-0 button-gradiant"
                      onClick={onDownloadCropClick}
                    >
                      Crop Barcode Scan
                    </Button>
                    <h1>Barcode Id: {result}</h1>
                  </div>
                )} */}
                <a
                  href="#hidden"
                  ref={hiddenAnchorRef}
                  download
                  style={{
                    position: "absolute",
                    top: "-200vh",
                    visibility: "hidden",
                  }}
                >
                  Hidden download
                </a>
              </div>
            </>
          )}
        </div>
        <div>
          {" "}
          <div>
            {isLoading && (
              <div className="loading-indicator">Processing...</div>
            )}
            {outputText && (
              <textarea
                rows={15}
                cols={50}
                readOnly
                value={outputText}
                style={{ fontSize: "22px", marginTop: "20px" }}
              />
            )}
          </div>
        </div>
        <div>
          {selectedImage && (
            <Form
              {...layout}
              initialValues={{ barcodeText: barcodeResult }} // Set default values here
              name="nest-messages"
              onFinish={onFinish}
              style={{
                maxWidth: 700,
              }}
            >
              {barcodeResult ? (
                <Form.Item
                  // name="barcodeText"
                  label="Barcode ID"
                  rules={[
                    {
                      required: true,
                      message: "Please input the Barcode Text!",
                    },
                  ]}
                >
                  <Input value={barcodeResult as any} />
                </Form.Item>
              ) : (
                <Form.Item
                  name="barcodeText"
                  label="Barcode ID"
                  rules={[
                    {
                      required: true,
                      message: "Please input the Barcode Text!",
                    },
                  ]}
                >
                  <Input name="barcodeText" onChange={handleInputData} />
                </Form.Item>
              )}
              <Form.Item
                name="airline"
                label="Airline"
                rules={[
                  {
                    required: true,
                    message: "Please input the Airline!",
                  },
                ]}
              >
                <Input name="airline" onChange={handleInputData} />
              </Form.Item>
              <Form.Item
                name="passengerName"
                label="Passenger"
                rules={[
                  {
                    required: true,
                    message: "Please input the Passenger Name!",
                  },
                ]}
              >
                <Input name="passengerName" onChange={handleInputData} />
              </Form.Item>
              <Form.Item
                name="fromCode"
                label="From Code"
                rules={[
                  {
                    required: true,
                    message: "Please input the From Code!",
                  },
                ]}
              >
                <Input name="fromCode" onChange={handleInputData} />
              </Form.Item>
              <Form.Item
                name="ToCode"
                label="To Code"
                rules={[
                  {
                    required: true,
                    message: "Please input the To Code!",
                  },
                ]}
              >
                <Input name="ToCode" onChange={handleInputData} />
              </Form.Item>
              <Form.Item
                name="dateTime"
                label="Date"
                rules={[
                  {
                    required: true,
                    message: "Please input the To Code!",
                  },
                ]}
              >
                <Input name="dateTime" onChange={handleInputData} />
              </Form.Item>

              <Form.Item
                wrapperCol={{
                  ...layout.wrapperCol,
                  offset: 8,
                }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ marginLeft: "100px" }}
                >
                  Submit
                </Button>
              </Form.Item>
            </Form>
          )}
          <div></div>
          {showScanner && (
            <Modal
              destroyOnClose={true}
              maskClosable={true}
              centered
              title={`Scan Barcode`}
              open={true}
              onCancel={handleShowScanner.bind(this, false)}
              width={"50%"}
              okButtonProps={{
                style: {
                  display: "none",
                },
              }}
              cancelButtonProps={{ style: { display: "none" } }}
            >
              <ScanBarcode
                handleDecodedText={handleDecodedText}
                handleShowScanner={handleShowScanner}
              />
            </Modal>
          )}
        </div>
      </div>
      <Modal
        open={isModalOpen}
        title={`Capture Image`}
        onCancel={closeModal}
        width={"50%"}
        okButtonProps={{
          style: {
            display: "none",
          },
        }}
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <Webcam ref={(webcam) => setWebcamRef(webcam)} />

        <button onClick={handleCaptureImage} disabled={isLoading}>
          Capture Image
        </button>
      </Modal>
    </div>
  );
};
export default ImageOcrApp;
