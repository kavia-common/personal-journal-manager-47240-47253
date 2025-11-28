import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header brand text', () => {
  render(<App />);
  const brand = screen.getByText(/Personal Journal/i);
  expect(brand).toBeInTheDocument();
});
