import { openWhatsApp, openInstagram, WHATSAPP_NUMBER, WHATSAPP_MESSAGE } from '@/lib/social-utils'

// Mock window.open
const mockWindowOpen = jest.fn()

// Override window.open
beforeAll(() => {
  Object.defineProperty(window, 'open', {
    value: mockWindowOpen,
    writable: true,
  })
})

describe('Social Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('WhatsApp functionality', () => {
    it('should have correct WhatsApp number', () => {
      expect(WHATSAPP_NUMBER).toBe('919704595252')
    })

    it('should have default WhatsApp message', () => {
      expect(WHATSAPP_MESSAGE).toBe("Hi! I'm interested in ordering fresh juices from Elixr. Can you help me?")
    })

    it('should open web WhatsApp for desktop users', () => {
      openWhatsApp()

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
        '_blank'
      )
    })

    it('should use custom message when provided', () => {
      const customMessage = 'Custom test message'

      openWhatsApp(customMessage)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(customMessage)}`,
        '_blank'
      )
    })
  })

  describe('Instagram functionality', () => {
    it('should open Instagram profile in new tab', () => {
      openInstagram()

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.instagram.com/elixr_healthy_sips',
        '_blank',
        'noopener,noreferrer'
      )
    })
  })
})
