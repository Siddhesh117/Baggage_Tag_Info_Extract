import Html5QrcodePlugin from "./Html5QrcodePlugin";

const ScanBarcode = (props: any) => {
  // handle decoded results here
  const onNewScanResult = (decodedText: string, decodedResult: any) => {
    props.handleDecodedText(decodedText);
    props.handleShowScanner(false);
  };

  return (
    <div className="App">
      <Html5QrcodePlugin fps={10} qrbox={400} disableFlip={false} qrCodeSuccessCallback={onNewScanResult} />
    </div>
  );
};

export default ScanBarcode;
