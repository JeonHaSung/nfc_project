import retapLogo from '../../assets/retap-logo.png'

function RetapLogo({ className = '', alt = 'RETAP' }) {
  return (
    <img
      className={`retap-logo${className ? ` ${className}` : ''}`}
      src={retapLogo}
      alt={alt}
      draggable="false"
    />
  )
}

export default RetapLogo
