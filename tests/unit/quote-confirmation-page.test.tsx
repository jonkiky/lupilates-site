import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfirmationPage from '@/app/quote-request/confirmation/[quoteNumber]/page';

describe('Quote request confirmation page', () => {
  it('links Continue browsing to home page', async () => {
    const component = await ConfirmationPage({
      params: Promise.resolve({ quoteNumber: 'Q-1776745659028' }),
    });

    render(component);

    const continueBrowsingLink = screen.getByRole('link', { name: /continue browsing/i });
    expect(continueBrowsingLink).toHaveAttribute('href', '/');
  });
});
