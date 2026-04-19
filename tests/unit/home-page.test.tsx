import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders the catalog entry point', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /request a quote/i })).toBeInTheDocument();
  });
});
